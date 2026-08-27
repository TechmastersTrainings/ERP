import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UpgradePlanDto {
  organizationId: string;
  planCode: string; // FREE, STARTER, PROFESSIONAL, ENTERPRISE
}

export interface PlanDefinition {
  code: string;
  name: string;
  monthly_price: number;
  monthly_invoices: number;
  max_users: number;
  max_companies: number;
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  private readonly PLANS: Record<string, PlanDefinition> = {
    FREE: {
      code: 'FREE',
      name: 'Free Tier',
      monthly_price: 0,
      monthly_invoices: 10,
      max_users: 1,
      max_companies: 1,
    },
    STARTER: {
      code: 'STARTER',
      name: 'Starter Business Plan',
      monthly_price: 999,
      monthly_invoices: 100,
      max_users: 3,
      max_companies: 2,
    },
    PROFESSIONAL: {
      code: 'PROFESSIONAL',
      name: 'Professional ERP Plan',
      monthly_price: 2999,
      monthly_invoices: 1000,
      max_users: 10,
      max_companies: 5,
    },
    ENTERPRISE: {
      code: 'ENTERPRISE',
      name: 'Enterprise Unlimited',
      monthly_price: 9999,
      monthly_invoices: 999999,
      max_users: 100,
      max_companies: 50,
    },
  };

  async getSubscription(organizationId: string) {
    const sub = await this.prisma.tenant_subscriptions.findUnique({
      where: { organization_id: organizationId },
    });

    const planCode = sub?.plan_code || 'FREE';
    const planDetails = this.PLANS[planCode] || this.PLANS.FREE;

    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const usage = await this.prisma.usage_logs.findFirst({
      where: {
        organization_id: organizationId,
        month_year: currentMonth,
        metric_name: 'INVOICES_CREATED',
      },
    });

    const invoicesUsed = usage?.count || 0;

    return {
      organization_id: organizationId,
      plan_code: planCode,
      status: sub?.status || 'ACTIVE',
      limits: planDetails,
      usage: {
        current_month: currentMonth,
        invoices_created: invoicesUsed,
        invoices_remaining: Math.max(
          0,
          planDetails.monthly_invoices - invoicesUsed,
        ),
      },
    };
  }

  async upgradePlan(dto: UpgradePlanDto) {
    const targetPlan = this.PLANS[dto.planCode];
    if (!targetPlan) {
      throw new ForbiddenException(
        `Invalid subscription plan code: ${dto.planCode}`,
      );
    }

    const updated = await this.prisma.tenant_subscriptions.upsert({
      where: { organization_id: dto.organizationId },
      update: { plan_code: dto.planCode, status: 'ACTIVE' },
      create: {
        organization_id: dto.organizationId,
        plan_code: dto.planCode,
        status: 'ACTIVE',
      },
    });

    await this.prisma.organizations.update({
      where: { id: dto.organizationId },
      data: { subscription_plan: dto.planCode },
    });

    await this.prisma.audit_logs.create({
      data: {
        organization_id: dto.organizationId,
        action: 'UPGRADE_SUBSCRIPTION_PLAN',
        entity: 'tenant_subscriptions',
        entity_id: updated.id,
        details: `Upgraded tenant plan to ${targetPlan.name} (${dto.planCode})`,
      },
    });

    return updated;
  }

  async incrementUsage(organizationId: string, metricName: string) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const existing = await this.prisma.usage_logs.findFirst({
      where: {
        organization_id: organizationId,
        month_year: currentMonth,
        metric_name: metricName,
      },
    });

    if (existing) {
      return this.prisma.usage_logs.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 },
      });
    } else {
      return this.prisma.usage_logs.create({
        data: {
          organization_id: organizationId,
          month_year: currentMonth,
          metric_name: metricName,
          count: 1,
        },
      });
    }
  }
}

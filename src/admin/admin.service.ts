import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingRegistrations() {
    const orgs = await this.prisma.organizations.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { created_at: 'desc' },
    });

    const results = await Promise.all(
      orgs.map(async (org) => {
        const company = await this.prisma.companies.findFirst({
          where: { organization_id: org.id },
        });
        const user = await this.prisma.users.findFirst({
          where: { organization_id: org.id },
        });
        return {
          organization_id: org.id,
          organization_name: org.name,
          owner_email: org.owner_email,
          status: org.status,
          created_at: org.created_at,
          legal_name: company?.legal_name || org.name,
          trade_name: company?.trade_name || org.name,
          gstin: company?.gstin || null,
          state: company?.state || null,
          owner_full_name: user?.full_name || 'N/A',
        };
      }),
    );

    return results;
  }

  async approveTenant(organizationId: string) {
    const org = await this.prisma.organizations.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization registration not found');
    }

    const updatedOrg = await this.prisma.organizations.update({
      where: { id: organizationId },
      data: { status: 'APPROVED' },
    });

    await this.prisma.tenant_subscriptions.updateMany({
      where: { organization_id: organizationId },
      data: { status: 'ACTIVE' },
    });

    return {
      message: `Tenant ${org.name} has been approved by Super Admin!`,
      organization: updatedOrg,
    };
  }
}

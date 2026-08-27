import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockSub = {
    organization_id: 'org-1',
    plan_code: 'STARTER',
    status: 'ACTIVE',
  };

  const prismaMock = {
    tenant_subscriptions: {
      findUnique: jest.fn().mockResolvedValue(mockSub),
      upsert: jest.fn().mockResolvedValue(mockSub),
    },
    usage_logs: { findFirst: jest.fn().mockResolvedValue({ count: 25 }) },
    organizations: { update: jest.fn().mockResolvedValue({}) },
    audit_logs: { create: jest.fn().mockResolvedValue({}) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should return subscription details and monthly remaining quota', async () => {
    const result = await service.getSubscription('org-1');
    expect(result.plan_code).toBe('STARTER');
    expect(result.limits.monthly_invoices).toBe(100);
    expect(result.usage.invoices_created).toBe(25);
    expect(result.usage.invoices_remaining).toBe(75);
  });
});

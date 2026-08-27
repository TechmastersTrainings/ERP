import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId?: string) {
    return this.prisma.audit_logs.findMany({
      where: organizationId ? { organization_id: organizationId } : {},
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}

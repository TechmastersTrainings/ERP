import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JobWorkService {
  constructor(private readonly prisma: PrismaService) {}

  async createChallan(dto: {
    companyId: string;
    jobWorkerName: string;
    jobWorkerGstin?: string;
    challanNumber: string;
    processType: string;
    notes?: string;
  }) {
    return this.prisma.job_work_challans.create({
      data: {
        company_id: dto.companyId,
        job_worker_name: dto.jobWorkerName,
        job_worker_gstin: dto.jobWorkerGstin,
        challan_number: dto.challanNumber,
        challan_date: new Date(),
        process_type: dto.processType,
        status: 'PENDING_RETURN',
        notes: dto.notes,
      },
    });
  }

  async getChallans(companyId: string) {
    return this.prisma.job_work_challans.findMany({
      where: { company_id: companyId },
      orderBy: { challan_date: 'desc' },
    });
  }

  async markGoodsReturned(id: string) {
    return this.prisma.job_work_challans.update({
      where: { id },
      data: { status: 'GOODS_RETURNED' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(dto: {
    companyId: string;
    productId: string;
    batchNumber: string;
    mfgDate?: string;
    expiryDate?: string;
    quantity: number;
  }) {
    return this.prisma.product_batches.create({
      data: {
        company_id: dto.companyId,
        product_id: dto.productId,
        batch_number: dto.batchNumber,
        mfg_date: dto.mfgDate ? new Date(dto.mfgDate) : null,
        expiry_date: dto.expiryDate ? new Date(dto.expiryDate) : null,
        quantity: dto.quantity,
      },
    });
  }

  async getProductBatches(companyId: string, productId: string) {
    const batches = await this.prisma.product_batches.findMany({
      where: { company_id: companyId, product_id: productId },
      orderBy: { expiry_date: 'asc' },
    });

    return batches.map((b) => ({
      ...b,
      quantity: Number(b.quantity),
    }));
  }

  async getExpiringBatches(companyId: string, daysAhead = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const batches = await this.prisma.product_batches.findMany({
      where: {
        company_id: companyId,
        expiry_date: {
          lte: targetDate,
        },
      },
      orderBy: { expiry_date: 'asc' },
    });

    return batches.map((b) => ({
      ...b,
      quantity: Number(b.quantity),
      is_expired: b.expiry_date ? b.expiry_date < new Date() : false,
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransfer(dto: {
    companyId: string;
    transferNumber: string;
    sourceWarehouseId: string;
    targetWarehouseId: string;
    productId: string;
    quantity: number;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stock_transfers.create({
        data: {
          company_id: dto.companyId,
          transfer_number: dto.transferNumber,
          source_warehouse_id: dto.sourceWarehouseId,
          target_warehouse_id: dto.targetWarehouseId,
          transfer_date: new Date(),
          product_id: dto.productId,
          quantity: dto.quantity,
          notes: dto.notes,
        },
      });

      // Outward from Source Warehouse
      await tx.stock_ledgers.create({
        data: {
          company_id: dto.companyId,
          warehouse_id: dto.sourceWarehouseId,
          product_id: dto.productId,
          movement_type: 'TRANSFER_OUT',
          reference_type: 'STOCK_TRANSFER',
          reference_id: transfer.id,
          quantity: -dto.quantity,
          balance_after: 0,
        },
      });

      // Inward to Target Warehouse
      await tx.stock_ledgers.create({
        data: {
          company_id: dto.companyId,
          warehouse_id: dto.targetWarehouseId,
          product_id: dto.productId,
          movement_type: 'TRANSFER_IN',
          reference_type: 'STOCK_TRANSFER',
          reference_id: transfer.id,
          quantity: dto.quantity,
          balance_after: dto.quantity,
        },
      });

      return {
        ...transfer,
        quantity: Number(transfer.quantity),
      };
    });
  }

  async getTransfers(companyId: string) {
    const transfers = await this.prisma.stock_transfers.findMany({
      where: { company_id: companyId },
      orderBy: { transfer_date: 'desc' },
    });

    return transfers.map((t) => ({
      ...t,
      quantity: Number(t.quantity),
    }));
  }
}

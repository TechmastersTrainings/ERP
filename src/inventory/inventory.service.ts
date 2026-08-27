import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateStockAdjustmentDto {
  companyId: string;
  productId: string;
  adjustmentType: 'INWARD' | 'OUTWARD';
  quantity: number;
  reason: string;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockLedger(companyId: string) {
    return this.prisma.stock_ledgers.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getStockSummary(companyId: string) {
    const products = await this.prisma.products.findMany({
      where: { company_id: companyId, is_service: false },
    });

    const summary = await Promise.all(
      products.map(async (product) => {
        const lastLedger = await this.prisma.stock_ledgers.findFirst({
          where: { company_id: companyId, product_id: product.id },
          orderBy: { created_at: 'desc' },
        });

        const currentStock = lastLedger ? Number(lastLedger.balance_after) : 0;
        const purchasePrice = Number(product.purchase_price || 0);
        const stockValue = currentStock * purchasePrice;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          hsn_code: product.hsn_code,
          unit: product.unit,
          purchase_price: purchasePrice,
          selling_price: Number(product.selling_price || 0),
          current_stock: currentStock,
          stock_value: stockValue,
        };
      }),
    );

    return summary;
  }

  async adjustStock(dto: CreateStockAdjustmentDto) {
    const product = await this.prisma.products.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const lastLedger = await this.prisma.stock_ledgers.findFirst({
      where: { company_id: dto.companyId, product_id: dto.productId },
      orderBy: { created_at: 'desc' },
    });

    const currentStock = lastLedger ? Number(lastLedger.balance_after) : 0;
    const qtyChange =
      dto.adjustmentType === 'INWARD' ? dto.quantity : -dto.quantity;
    const newStock = currentStock + qtyChange;

    return this.prisma.$transaction(async (tx) => {
      const ledgerEntry = await tx.stock_ledgers.create({
        data: {
          company_id: dto.companyId,
          product_id: dto.productId,
          movement_type: dto.adjustmentType,
          reference_type: 'MANUAL_ADJUSTMENT',
          quantity: qtyChange,
          unit_price: Number(product.purchase_price || 0),
          balance_after: newStock,
        },
      });

      await tx.audit_logs.create({
        data: {
          action: 'STOCK_ADJUSTMENT',
          entity: 'stock_ledgers',
          entity_id: ledgerEntry.id,
          details: `Manual Stock Adjustment (${dto.adjustmentType}) of ${dto.quantity} ${product.unit} for ${product.name}. Reason: ${dto.reason}`,
        },
      });

      return ledgerEntry;
    });
  }
}

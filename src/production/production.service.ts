import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async createBom(dto: {
    companyId: string;
    finishedProductId: string;
    rawMaterialId: string;
    quantityRequired: number;
  }) {
    const bom = await this.prisma.bill_of_materials.create({
      data: {
        company_id: dto.companyId,
        finished_product_id: dto.finishedProductId,
        raw_material_id: dto.rawMaterialId,
        quantity_required: dto.quantityRequired,
      },
    });

    return {
      ...bom,
      quantity_required: Number(bom.quantity_required),
    };
  }

  async getBoms(companyId: string) {
    const boms = await this.prisma.bill_of_materials.findMany({
      where: { company_id: companyId },
    });

    return boms.map((b) => ({
      ...b,
      quantity_required: Number(b.quantity_required),
    }));
  }

  async executeProductionOrder(dto: {
    companyId: string;
    productionNumber: string;
    finishedProductId: string;
    quantityToProduce: number;
    warehouseId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const boms = await tx.bill_of_materials.findMany({
        where: {
          company_id: dto.companyId,
          finished_product_id: dto.finishedProductId,
        },
      });

      // 1. Deduct raw material inventory stock ledgers based on BOM ratio
      for (const bom of boms) {
        const requiredQty =
          Number(bom.quantity_required) * dto.quantityToProduce;
        await tx.stock_ledgers.create({
          data: {
            company_id: dto.companyId,
            warehouse_id: dto.warehouseId,
            product_id: bom.raw_material_id,
            movement_type: 'OUTWARD',
            reference_type: 'PRODUCTION_CONSUMPTION',
            quantity: requiredQty,
            balance_after: 0,
          },
        });
      }

      // 2. Add finished product inventory stock ledger
      await tx.stock_ledgers.create({
        data: {
          company_id: dto.companyId,
          warehouse_id: dto.warehouseId,
          product_id: dto.finishedProductId,
          movement_type: 'INWARD',
          reference_type: 'PRODUCTION_OUTPUT',
          quantity: dto.quantityToProduce,
          balance_after: dto.quantityToProduce,
        },
      });

      // 3. Create Production Order record
      const order = await tx.production_orders.create({
        data: {
          company_id: dto.companyId,
          production_number: dto.productionNumber,
          finished_product_id: dto.finishedProductId,
          quantity_to_produce: dto.quantityToProduce,
          warehouse_id: dto.warehouseId,
          status: 'COMPLETED',
        },
      });

      // 4. Auto-post WIP Manufacturing Journal Entry to General Ledger
      const estFinishedValuation = dto.quantityToProduce * 2500;
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PRODUCTION_ORDER',
          reference_id: order.id,
          account_name: 'Finished Goods Inventory Account',
          debit: estFinishedValuation,
          credit: 0,
          narration: `Finished Goods manufactured under Order ${dto.productionNumber}`,
          entry_date: new Date(),
        },
      });

      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PRODUCTION_ORDER',
          reference_id: order.id,
          account_name: 'Raw Material Consumption Account',
          debit: 0,
          credit: estFinishedValuation,
          narration: `Raw Materials consumed under Order ${dto.productionNumber}`,
          entry_date: new Date(),
        },
      });

      return {
        ...order,
        quantity_to_produce: Number(order.quantity_to_produce),
        rawMaterialTypesConsumed: boms.length,
      };
    });
  }

  async getProductionOrders(companyId: string) {
    const orders = await this.prisma.production_orders.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      quantity_to_produce: Number(o.quantity_to_produce),
    }));
  }
}

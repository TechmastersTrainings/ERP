import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createSalesOrder(dto: {
    companyId: string;
    customerId: string;
    orderNumber: string;
    totalAmount: number;
    notes?: string;
  }) {
    return this.prisma.sales_orders.create({
      data: {
        company_id: dto.companyId,
        customer_id: dto.customerId,
        order_number: dto.orderNumber,
        order_date: new Date(),
        total_amount: dto.totalAmount,
        status: 'CONFIRMED',
        notes: dto.notes,
      },
    });
  }

  async getSalesOrders(companyId: string) {
    const orders = await this.prisma.sales_orders.findMany({
      where: { company_id: companyId },
      orderBy: { order_date: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      total_amount: Number(o.total_amount),
    }));
  }

  async createPurchaseOrder(dto: {
    companyId: string;
    supplierId: string;
    poNumber: string;
    totalAmount: number;
    notes?: string;
  }) {
    return this.prisma.purchase_orders.create({
      data: {
        company_id: dto.companyId,
        supplier_id: dto.supplierId,
        po_number: dto.poNumber,
        po_date: new Date(),
        total_amount: dto.totalAmount,
        status: 'ISSUED',
        notes: dto.notes,
      },
    });
  }

  async getPurchaseOrders(companyId: string) {
    const orders = await this.prisma.purchase_orders.findMany({
      where: { company_id: companyId },
      orderBy: { po_date: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      total_amount: Number(o.total_amount),
    }));
  }
}

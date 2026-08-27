import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('sales')
  async createSO(
    @Body()
    body: {
      companyId: string;
      customerId: string;
      orderNumber: string;
      totalAmount: number;
      notes?: string;
    },
  ) {
    return this.ordersService.createSalesOrder(body);
  }

  @Get('sales')
  async getSO(@Query('companyId') companyId: string) {
    return this.ordersService.getSalesOrders(companyId || '');
  }

  @Post('purchase')
  async createPO(
    @Body()
    body: {
      companyId: string;
      supplierId: string;
      poNumber: string;
      totalAmount: number;
      notes?: string;
    },
  ) {
    return this.ordersService.createPurchaseOrder(body);
  }

  @Get('purchase')
  async getPO(@Query('companyId') companyId: string) {
    return this.ordersService.getPurchaseOrders(companyId || '');
  }
}

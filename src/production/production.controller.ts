import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProductionService } from './production.service.js';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('bom')
  async createBom(
    @Body()
    body: {
      companyId: string;
      finishedProductId: string;
      rawMaterialId: string;
      quantityRequired: number;
    },
  ) {
    return this.productionService.createBom(body);
  }

  @Get('bom')
  async getBoms(@Query('companyId') companyId: string) {
    return this.productionService.getBoms(companyId || '');
  }

  @Post('orders')
  async executeProductionOrder(
    @Body()
    body: {
      companyId: string;
      productionNumber: string;
      finishedProductId: string;
      quantityToProduce: number;
      warehouseId: string;
    },
  ) {
    return this.productionService.executeProductionOrder(body);
  }

  @Get('orders')
  async getProductionOrders(@Query('companyId') companyId: string) {
    return this.productionService.getProductionOrders(companyId || '');
  }
}

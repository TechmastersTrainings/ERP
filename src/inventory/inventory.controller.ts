import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  InventoryService,
  CreateStockAdjustmentDto,
} from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock-ledger')
  getStockLedger(@Query('companyId') companyId: string) {
    return this.inventoryService.getStockLedger(companyId);
  }

  @Get('summary')
  getStockSummary(@Query('companyId') companyId: string) {
    return this.inventoryService.getStockSummary(companyId);
  }

  @Post('adjustments')
  adjustStock(@Body() dto: CreateStockAdjustmentDto) {
    return this.inventoryService.adjustStock(dto);
  }
}

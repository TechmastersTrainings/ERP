import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service.js';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  async createTransfer(
    @Body()
    dto: {
      companyId: string;
      transferNumber: string;
      sourceWarehouseId: string;
      targetWarehouseId: string;
      productId: string;
      quantity: number;
      notes?: string;
    },
  ) {
    return this.transfersService.createTransfer(dto);
  }

  @Get()
  async getTransfers(@Query('companyId') companyId: string) {
    return this.transfersService.getTransfers(companyId || '');
  }
}

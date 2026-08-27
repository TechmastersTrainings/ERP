import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { BatchesService } from './batches.service.js';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  async createBatch(
    @Body()
    body: {
      companyId: string;
      productId: string;
      batchNumber: string;
      mfgDate?: string;
      expiryDate?: string;
      quantity: number;
    },
  ) {
    return this.batchesService.createBatch(body);
  }

  @Get()
  async getBatches(
    @Query('companyId') companyId: string,
    @Query('productId') productId: string,
  ) {
    return this.batchesService.getProductBatches(companyId, productId);
  }

  @Get('expiring')
  async getExpiring(
    @Query('companyId') companyId: string,
    @Query('days') days?: string,
  ) {
    return this.batchesService.getExpiringBatches(
      companyId,
      days ? Number(days) : 30,
    );
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  PurchasesService,
  CreatePurchaseInvoiceDto,
} from './purchases.service';

@Controller('purchases/invoices')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchasesService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.purchasesService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }
}

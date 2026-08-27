import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SalesService, CreateSalesInvoiceDto } from './sales.service';

@Controller('sales/invoices')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSalesInvoiceDto) {
    return this.salesService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.salesService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}

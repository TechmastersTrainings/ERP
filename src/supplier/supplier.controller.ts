import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SupplierService, CreateSupplierDto } from './supplier.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.supplierService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }
}

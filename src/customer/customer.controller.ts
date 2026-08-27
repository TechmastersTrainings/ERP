import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CustomerService, CreateCustomerDto } from './customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.customerService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }
}

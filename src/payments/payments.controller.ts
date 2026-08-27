import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PaymentsService, CreatePaymentDto } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.paymentsService.findAll(companyId);
  }
}

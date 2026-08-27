import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EwaybillService, GenerateEWayBillDto } from './ewaybill.service';

@Controller('ewaybill')
export class EwaybillController {
  constructor(private readonly ewaybillService: EwaybillService) {}

  @Post('generate')
  generateEWayBill(@Body() dto: GenerateEWayBillDto) {
    return this.ewaybillService.generateEWayBill(dto);
  }

  @Get(':invoiceId')
  getEWayBill(@Param('invoiceId') invoiceId: string) {
    return this.ewaybillService.getEWayBill(invoiceId);
  }
}

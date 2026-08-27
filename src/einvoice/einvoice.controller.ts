import { Controller, Get, Post, Param } from '@nestjs/common';
import { EinvoiceService } from './einvoice.service';

@Controller('einvoice')
export class EinvoiceController {
  constructor(private readonly einvoiceService: EinvoiceService) {}

  @Get('payload/:invoiceId')
  generatePayload(@Param('invoiceId') invoiceId: string) {
    return this.einvoiceService.generatePayload(invoiceId);
  }

  @Post('submit/:invoiceId')
  submitEInvoice(@Param('invoiceId') invoiceId: string) {
    return this.einvoiceService.submitEInvoice(invoiceId);
  }

  @Get(':invoiceId')
  getEInvoice(@Param('invoiceId') invoiceId: string) {
    return this.einvoiceService.getEInvoice(invoiceId);
  }
}

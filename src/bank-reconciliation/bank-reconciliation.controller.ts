import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { BankReconciliationService } from './bank-reconciliation.service.js';

@Controller('bank-reconciliation')
export class BankReconciliationController {
  constructor(private readonly bankRecService: BankReconciliationService) {}

  @Post('statements')
  async uploadStatement(
    @Body()
    body: {
      companyId: string;
      transactionDate: string;
      referenceNumber: string;
      description: string;
      amount: number;
      transactionType: 'CREDIT' | 'DEBIT';
    },
  ) {
    return this.bankRecService.uploadBankStatementLine(body);
  }

  @Post('reconcile')
  async runAutoReconciliation(@Body() body: { companyId: string }) {
    return this.bankRecService.runAutoReconciliation(body.companyId);
  }

  @Get('brs')
  async getBrsSummary(@Query('companyId') companyId: string) {
    return this.bankRecService.getBrsSummary(companyId || '');
  }
}

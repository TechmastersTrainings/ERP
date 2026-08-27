import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  ReconciliationService,
  RunReconciliationDto,
} from './reconciliation.service';

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('gstr2b')
  runReconciliation(@Body() dto: RunReconciliationDto) {
    return this.reconciliationService.runReconciliation(dto);
  }

  @Get('history')
  getReconciliationHistory(@Query('companyId') companyId: string) {
    return this.reconciliationService.getReconciliationHistory(companyId);
  }
}

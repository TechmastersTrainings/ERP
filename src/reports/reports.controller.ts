import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('general-ledger')
  getGeneralLedger(@Query('companyId') companyId: string) {
    return this.reportsService.getGeneralLedger(companyId);
  }

  @Get('trial-balance')
  getTrialBalance(@Query('companyId') companyId: string) {
    return this.reportsService.getTrialBalance(companyId);
  }

  @Get('profit-loss')
  getProfitAndLoss(@Query('companyId') companyId: string) {
    return this.reportsService.getProfitAndLoss(companyId);
  }

  @Get('balance-sheet')
  getBalanceSheet(@Query('companyId') companyId: string) {
    return this.reportsService.getBalanceSheet(companyId);
  }

  @Get('aging/receivables')
  getReceivableAging(@Query('companyId') companyId: string) {
    return this.reportsService.getReceivableAging(companyId);
  }
}

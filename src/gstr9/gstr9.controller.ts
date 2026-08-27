import { Controller, Get, Query } from '@nestjs/common';
import { Gstr9Service } from './gstr9.service.js';

@Controller('gstr9')
export class Gstr9Controller {
  constructor(private readonly gstr9Service: Gstr9Service) {}

  @Get('annual-summary')
  async getAnnualSummary(
    @Query('companyId') companyId: string,
    @Query('financialYear') financialYear?: string,
  ) {
    return this.gstr9Service.generateAnnualReturnSummary(
      companyId || '',
      financialYear,
    );
  }
}

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ConsolidationService } from './consolidation.service.js';

@Controller('consolidation')
export class ConsolidationController {
  constructor(private readonly consolidationService: ConsolidationService) {}

  @Post('groups')
  async linkGroupCompanies(
    @Body()
    body: {
      groupName: string;
      parentCompanyId: string;
      childCompanyId: string;
      ownershipPercent?: number;
    },
  ) {
    return this.consolidationService.linkGroupCompanies(body);
  }

  @Get('financials')
  async getConsolidatedFinancials(
    @Query('parentCompanyId') parentCompanyId: string,
  ) {
    return this.consolidationService.getConsolidatedFinancials(
      parentCompanyId || '',
    );
  }
}

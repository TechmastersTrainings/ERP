import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query('companyId') companyId: string) {
    return this.analyticsService.getExecutiveDashboard(companyId || '');
  }
}

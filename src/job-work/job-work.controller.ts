import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { JobWorkService } from './job-work.service.js';

@Controller('job-work')
export class JobWorkController {
  constructor(private readonly jobWorkService: JobWorkService) {}

  @Post('challans')
  async createChallan(
    @Body()
    body: {
      companyId: string;
      jobWorkerName: string;
      jobWorkerGstin?: string;
      challanNumber: string;
      processType: string;
      notes?: string;
    },
  ) {
    return this.jobWorkService.createChallan(body);
  }

  @Get('challans')
  async getChallans(@Query('companyId') companyId: string) {
    return this.jobWorkService.getChallans(companyId || '');
  }

  @Post('challans/:id/return')
  async markReturned(@Param('id') id: string) {
    return this.jobWorkService.markGoodsReturned(id);
  }
}

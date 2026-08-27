import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TdsTcsService } from './tds-tcs.service.js';

@Controller('tds-tcs')
export class TdsTcsController {
  constructor(private readonly tdsTcsService: TdsTcsService) {}

  @Post('calculate')
  async calculate(
    @Body()
    body: {
      companyId: string;
      partyName: string;
      pan: string;
      section: '194Q' | '194C' | '194J' | '206C1H';
      taxType: 'TDS' | 'TCS';
      taxableAmount: number;
    },
  ) {
    return this.tdsTcsService.calculateAndRecord(body);
  }

  @Get('form26q')
  async getForm26Q(@Query('companyId') companyId: string) {
    return this.tdsTcsService.getForm26QSummary(companyId || '');
  }
}

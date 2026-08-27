import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ForexService } from './forex.service.js';

@Controller('forex')
export class ForexController {
  constructor(private readonly forexService: ForexService) {}

  @Post('rates')
  async setRate(@Body() body: { currencyCode: string; rateToInr: number }) {
    return this.forexService.setExchangeRate(body.currencyCode, body.rateToInr);
  }

  @Get('rate')
  async getRate(@Query('currency') currency: string) {
    const rate = await this.forexService.getLatestRate(currency || 'USD');
    return { currency: (currency || 'USD').toUpperCase(), rate_to_inr: rate };
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('currency') currency: string,
  ) {
    return this.forexService.convertToINR(
      Number(amount || 0),
      currency || 'USD',
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ForexService {
  constructor(private readonly prisma: PrismaService) {}

  async setExchangeRate(currencyCode: string, rateToInr: number) {
    const code = currencyCode.toUpperCase();
    return this.prisma.forex_rates.create({
      data: {
        currency_code: code,
        rate_to_inr: rateToInr,
      },
    });
  }

  async getLatestRate(currencyCode: string): Promise<number> {
    const code = currencyCode.toUpperCase();
    if (code === 'INR') return 1.0;

    const defaults: Record<string, number> = {
      USD: 86.5,
      EUR: 91.2,
      GBP: 108.4,
      AED: 23.5,
    };

    try {
      const record = await this.prisma.forex_rates.findFirst({
        where: { currency_code: code },
        orderBy: { effective_date: 'desc' },
      });

      if (record) {
        return Number(record.rate_to_inr);
      }
    } catch (e) {
      console.warn('Forex rate query fallback:', e);
    }

    return defaults[code] || 1.0;
  }

  async convertToINR(
    amount: number,
    currencyCode: string,
  ): Promise<{ amountInr: number; exchangeRate: number }> {
    const rate = await this.getLatestRate(currencyCode);
    return {
      amountInr: Math.round(amount * rate * 100) / 100,
      exchangeRate: rate,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TdsTcsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAndRecord(dto: {
    companyId: string;
    partyName: string;
    pan: string;
    section: '194Q' | '194C' | '194J' | '206C1H';
    taxType: 'TDS' | 'TCS';
    taxableAmount: number;
  }) {
    // Statutory Section Rates
    const rates: Record<string, number> = {
      '194Q': 0.1, // Goods Purchase > 50L (0.1%)
      '194C': 1.0, // Contractor Individual (1.0%)
      '194J': 10.0, // Professional Services (10.0%)
      '206C1H': 0.1, // TCS Goods Sale > 50L (0.1%)
    };

    const ratePercent = rates[dto.section] || 0.1;
    const taxWithheld =
      Math.round(dto.taxableAmount * (ratePercent / 100) * 100) / 100;

    const record = await this.prisma.tds_tcs_records.create({
      data: {
        company_id: dto.companyId,
        party_name: dto.partyName,
        pan: dto.pan.toUpperCase(),
        section: dto.section,
        tax_type: dto.taxType,
        taxable_amount: dto.taxableAmount,
        rate_percent: ratePercent,
        tax_withheld: taxWithheld,
        deduction_date: new Date(),
      },
    });

    return {
      recordId: record.id,
      partyName: record.party_name,
      pan: record.pan,
      section: record.section,
      taxType: record.tax_type,
      taxableAmount: Number(record.taxable_amount),
      ratePercent: Number(record.rate_percent),
      taxWithheld: Number(record.tax_withheld),
    };
  }

  async getForm26QSummary(companyId: string) {
    const records = await this.prisma.tds_tcs_records.findMany({
      where: { company_id: companyId, tax_type: 'TDS' },
      orderBy: { deduction_date: 'desc' },
    });

    const totalTdsWithheld = records.reduce(
      (acc, r) => acc + Number(r.tax_withheld),
      0,
    );
    const totalTaxableValue = records.reduce(
      (acc, r) => acc + Number(r.taxable_amount),
      0,
    );

    return {
      quarter: 'Q3-2026',
      form_type: 'Form 26Q (Quarterly TDS Return)',
      total_deductions: records.length,
      total_taxable_value: totalTaxableValue,
      total_tds_withheld: totalTdsWithheld,
      records: records.map((r) => ({
        ...r,
        taxable_amount: Number(r.taxable_amount),
        rate_percent: Number(r.rate_percent),
        tax_withheld: Number(r.tax_withheld),
      })),
    };
  }
}

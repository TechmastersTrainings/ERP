import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class Gstr9Service {
  constructor(private readonly prisma: PrismaService) {}

  async generateAnnualReturnSummary(
    companyId: string,
    financialYear: string = '2025-26',
  ) {
    // 1. Fetch all sales invoices for the company
    const sales = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId },
    });

    const totalTurnover = sales.reduce((acc, s) => acc + Number(s.subtotal), 0);
    const totalOutputTax = sales.reduce(
      (acc, s) =>
        acc +
        Number(s.cgst_total) +
        Number(s.sgst_total) +
        Number(s.igst_total),
      0,
    );

    // 2. Fetch all purchase bills for the company (ITC claimed per 3B)
    const purchases = await this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId },
    });

    const totalItcClaimed3B = purchases.reduce(
      (acc, p) =>
        acc +
        Number(p.cgst_total) +
        Number(p.sgst_total) +
        Number(p.igst_total),
      0,
    );

    // 3. Fetch GSTR-2B reconciliation records (ITC available per portal)
    const gstr2bRecords = await this.prisma.gstr2b_reconciliations.findMany({
      where: { company_id: companyId },
    });

    const totalItcAvailable2B = gstr2bRecords.reduce(
      (acc, r) => acc + Number(r.gstr2b_tax_amount),
      0,
    );
    const itcDifference = totalItcClaimed3B - totalItcAvailable2B;

    return {
      financialYear,
      table4_outward_supplies: {
        b2b_taxable_turnover: totalTurnover,
        output_cgst: sales.reduce((acc, s) => acc + Number(s.cgst_total), 0),
        output_sgst: sales.reduce((acc, s) => acc + Number(s.sgst_total), 0),
        output_igst: sales.reduce((acc, s) => acc + Number(s.igst_total), 0),
        total_output_liability: totalOutputTax,
      },
      table6_7_8_itc_reconciliation: {
        total_itc_claimed_gstr3b: totalItcClaimed3B,
        total_itc_available_gstr2b: totalItcAvailable2B,
        itc_unreconciled_difference: itcDifference,
        audit_risk_status:
          Math.abs(itcDifference) < 1 ? 'LOW_RISK' : 'AUDIT_NOTICE_RISK',
      },
      table9_tax_paid_summary: {
        tax_paid_in_cash:
          totalOutputTax > totalItcClaimed3B
            ? totalOutputTax - totalItcClaimed3B
            : 0,
        tax_paid_via_itc: Math.min(totalOutputTax, totalItcClaimed3B),
      },
    };
  }
}

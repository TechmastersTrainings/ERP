import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class Gstr2bRecordDto {
  supplierGstin: string;
  supplierInvNumber: string;
  taxableValue: number;
  taxAmount: number;
}

export class RunReconciliationDto {
  companyId: string;
  gstr2bRecords: Gstr2bRecordDto[];
}

export interface ReconciliationItemResult {
  id: string;
  company_id: string;
  purchase_invoice_id: string | null;
  supplier_gstin: string;
  supplier_inv_number: string;
  gstr2b_taxable_val: unknown;
  gstr2b_tax_amount: unknown;
  internal_taxable_val: unknown;
  internal_tax_amount: unknown;
  match_status: string;
  created_at: Date | null;
}

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async runReconciliation(dto: RunReconciliationDto) {
    const internalBills = await this.prisma.purchase_invoices.findMany({
      where: { company_id: dto.companyId, status: { not: 'CANCELLED' } },
    });

    const results: ReconciliationItemResult[] = [];

    // 1. Process GSTR-2B items against internal bills
    for (const g2b of dto.gstr2bRecords) {
      const matchedBill = internalBills.find(
        (b) =>
          b.bill_number.trim().toLowerCase() ===
          g2b.supplierInvNumber.trim().toLowerCase(),
      );

      let status = 'MISSING_IN_BOOKS';
      let internalTaxable = 0;
      let internalTax = 0;
      let billId: string | null = null;

      if (matchedBill) {
        billId = matchedBill.id;
        internalTaxable =
          Number(matchedBill.subtotal) - Number(matchedBill.discount_total);
        internalTax =
          Number(matchedBill.cgst_total) +
          Number(matchedBill.sgst_total) +
          Number(matchedBill.igst_total);

        const diffTaxable = Math.abs(internalTaxable - g2b.taxableValue);
        const diffTax = Math.abs(internalTax - g2b.taxAmount);

        if (diffTaxable <= 1.0 && diffTax <= 1.0) {
          status = 'MATCHED';
        } else {
          status = 'MISMATCH';
        }
      }

      const rec = await this.prisma.gstr2b_reconciliations.create({
        data: {
          company_id: dto.companyId,
          purchase_invoice_id: billId,
          supplier_gstin: g2b.supplierGstin,
          supplier_inv_number: g2b.supplierInvNumber,
          gstr2b_taxable_val: g2b.taxableValue,
          gstr2b_tax_amount: g2b.taxAmount,
          internal_taxable_val: internalTaxable,
          internal_tax_amount: internalTax,
          match_status: status,
        },
      });

      results.push(rec);
    }

    // 2. Identify Internal Bills missing in GSTR-2B
    for (const bill of internalBills) {
      const foundInG2b = dto.gstr2bRecords.some(
        (g) =>
          g.supplierInvNumber.trim().toLowerCase() ===
          bill.bill_number.trim().toLowerCase(),
      );

      if (!foundInG2b) {
        const supplier = await this.prisma.suppliers.findUnique({
          where: { id: bill.supplier_id },
        });

        const internalTaxable =
          Number(bill.subtotal) - Number(bill.discount_total);
        const internalTax =
          Number(bill.cgst_total) +
          Number(bill.sgst_total) +
          Number(bill.igst_total);

        const rec = await this.prisma.gstr2b_reconciliations.create({
          data: {
            company_id: dto.companyId,
            purchase_invoice_id: bill.id,
            supplier_gstin: supplier?.gstin || 'UNKNOWN',
            supplier_inv_number: bill.bill_number,
            gstr2b_taxable_val: 0,
            gstr2b_tax_amount: 0,
            internal_taxable_val: internalTaxable,
            internal_tax_amount: internalTax,
            match_status: 'MISSING_IN_2B',
          },
        });

        results.push(rec);
      }
    }

    return {
      total_processed: results.length,
      matched_count: results.filter((r) => r.match_status === 'MATCHED').length,
      mismatch_count: results.filter((r) => r.match_status === 'MISMATCH')
        .length,
      missing_in_books_count: results.filter(
        (r) => r.match_status === 'MISSING_IN_BOOKS',
      ).length,
      missing_in_2b_count: results.filter(
        (r) => r.match_status === 'MISSING_IN_2B',
      ).length,
      details: results,
    };
  }

  async getReconciliationHistory(companyId: string) {
    return this.prisma.gstr2b_reconciliations.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}

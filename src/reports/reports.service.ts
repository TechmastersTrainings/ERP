import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // 1. General Ledger
  async getGeneralLedger(companyId: string) {
    const entries = await this.prisma.journal_entries.findMany({
      where: { company_id: companyId },
      orderBy: { entry_date: 'asc' },
    });

    const ledgerMap: Record<
      string,
      {
        debits: number;
        credits: number;
        net_balance: number;
        transactions: any[];
      }
    > = {};

    for (const e of entries) {
      const acct = e.account_name;
      if (!ledgerMap[acct]) {
        ledgerMap[acct] = {
          debits: 0,
          credits: 0,
          net_balance: 0,
          transactions: [],
        };
      }

      const dr = Number(e.debit);
      const cr = Number(e.credit);

      ledgerMap[acct].debits += dr;
      ledgerMap[acct].credits += cr;
      ledgerMap[acct].net_balance += dr - cr;
      ledgerMap[acct].transactions.push(e);
    }

    return ledgerMap;
  }

  // 2. Trial Balance
  async getTrialBalance(companyId: string) {
    const entries = await this.prisma.journal_entries.findMany({
      where: { company_id: companyId },
    });

    const accounts: Record<string, { debit: number; credit: number }> = {};

    for (const e of entries) {
      const acct = e.account_name;
      if (!accounts[acct]) accounts[acct] = { debit: 0, credit: 0 };
      accounts[acct].debit += Number(e.debit);
      accounts[acct].credit += Number(e.credit);
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = Object.keys(accounts).map((acct) => {
      const dr = accounts[acct].debit;
      const cr = accounts[acct].credit;
      totalDebit += dr;
      totalCredit += cr;
      return {
        account_name: acct,
        total_debit: dr,
        total_credit: cr,
        net_balance: dr - cr,
      };
    });

    return {
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      rows,
    };
  }

  // 3. Profit & Loss Statement
  async getProfitAndLoss(companyId: string) {
    const sales = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId, status: { not: 'CANCELLED' } },
    });

    const purchases = await this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId, status: { not: 'CANCELLED' } },
    });

    const creditNotes = await this.prisma.credit_notes.findMany({
      where: { company_id: companyId },
    });

    const debitNotes = await this.prisma.debit_notes.findMany({
      where: { company_id: companyId },
    });

    const grossSales = sales.reduce(
      (acc, s) => acc + (Number(s.subtotal) - Number(s.discount_total)),
      0,
    );
    const salesReturns = creditNotes.reduce(
      (acc, c) => acc + Number(c.subtotal),
      0,
    );
    const netRevenue = grossSales - salesReturns;

    const grossPurchases = purchases.reduce(
      (acc, p) => acc + (Number(p.subtotal) - Number(p.discount_total)),
      0,
    );
    const purchaseReturns = debitNotes.reduce(
      (acc, d) => acc + Number(d.subtotal),
      0,
    );
    const costOfGoodsSold = grossPurchases - purchaseReturns;

    const grossProfit = netRevenue - costOfGoodsSold;
    const netOperatingProfit = grossProfit;

    return {
      revenue: {
        gross_sales: grossSales,
        sales_returns: salesReturns,
        net_revenue: netRevenue,
      },
      cost_of_sales: {
        gross_purchases: grossPurchases,
        purchase_returns: purchaseReturns,
        cogs: costOfGoodsSold,
      },
      gross_profit: grossProfit,
      net_profit: netOperatingProfit,
    };
  }

  // 4. Balance Sheet
  async getBalanceSheet(companyId: string) {
    // Current Assets
    const sales = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId },
    });
    const purchases = await this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId },
    });
    const stock = await this.prisma.stock_ledgers.findMany({
      where: { company_id: companyId },
    });

    const totalAR = sales.reduce((acc, s) => acc + Number(s.balance_due), 0);
    const totalAP = purchases.reduce(
      (acc, p) => acc + Number(p.balance_due),
      0,
    );
    const itcAsset = purchases.reduce(
      (acc, p) =>
        acc +
        Number(p.cgst_total) +
        Number(p.sgst_total) +
        Number(p.igst_total),
      0,
    );
    const outputTaxLiability = sales.reduce(
      (acc, s) =>
        acc +
        Number(s.cgst_total) +
        Number(s.sgst_total) +
        Number(s.igst_total),
      0,
    );

    const stockValue = stock.reduce(
      (acc, s) => acc + Number(s.quantity) * Number(s.unit_price || 0),
      0,
    );

    const totalAssets = totalAR + stockValue + itcAsset;
    const totalLiabilities = totalAP + outputTaxLiability;
    const netEquity = totalAssets - totalLiabilities;

    return {
      assets: {
        accounts_receivable: totalAR,
        inventory_asset: stockValue,
        input_tax_credit_asset: itcAsset,
        total_assets: totalAssets,
      },
      liabilities: {
        accounts_payable: totalAP,
        output_tax_liability: outputTaxLiability,
        total_liabilities: totalLiabilities,
      },
      equity: {
        retained_earnings: netEquity,
        total_equity: netEquity,
      },
      is_balanced:
        Math.abs(totalAssets - (totalLiabilities + netEquity)) < 0.01,
    };
  }

  // 5. Customer AR Aging Analysis
  async getReceivableAging(companyId: string) {
    const unpaidInvoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId, balance_due: { gt: 0 } },
    });

    const now = new Date();
    const aging = {
      current_0_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      above_90: 0,
      total_ar: 0,
    };

    for (const inv of unpaidInvoices) {
      const invDate = new Date(inv.invoice_date);
      const diffDays = Math.floor(
        (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24),
      );
      const due = Number(inv.balance_due);

      aging.total_ar += due;
      if (diffDays <= 30) aging.current_0_30 += due;
      else if (diffDays <= 60) aging.days_31_60 += due;
      else if (diffDays <= 90) aging.days_61_90 += due;
      else aging.above_90 += due;
    }

    return aging;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(companyId: string) {
    const salesInvoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId },
    });

    const purchaseInvoices = await this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId },
    });

    const totalSales = salesInvoices.reduce(
      (acc, i) => acc + Number(i.grand_total),
      0,
    );
    const totalPurchases = purchaseInvoices.reduce(
      (acc, i) => acc + Number(i.grand_total),
      0,
    );

    const grossProfit = totalSales - totalPurchases;
    const grossMarginPercent =
      totalSales > 0 ? Math.round((grossProfit / totalSales) * 10000) / 100 : 0;

    const outstandingReceivables = salesInvoices.reduce(
      (acc, i) => acc + Number(i.balance_due),
      0,
    );
    const outstandingPayables = purchaseInvoices.reduce(
      (acc, i) => acc + Number(i.balance_due),
      0,
    );

    return {
      revenue: {
        total_sales: totalSales,
        total_invoices: salesInvoices.length,
      },
      expenditure: {
        total_purchases: totalPurchases,
        total_bills: purchaseInvoices.length,
      },
      profitability: {
        gross_profit: grossProfit,
        gross_margin_percent: grossMarginPercent,
      },
      cashflow: {
        outstanding_ar: outstandingReceivables,
        outstanding_ap: outstandingPayables,
        net_working_capital_buffer:
          outstandingReceivables - outstandingPayables,
      },
    };
  }
}

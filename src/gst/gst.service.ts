import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GstService {
  constructor(private prisma: PrismaService) {}

  async getGstSummary(companyId: string) {
    const salesInvoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId, status: { not: 'CANCELLED' } },
    });

    const purchaseInvoices = await this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId, status: { not: 'CANCELLED' } },
    });

    let outputCgst = 0;
    let outputSgst = 0;
    let outputIgst = 0;
    let totalTaxableSales = 0;

    for (const inv of salesInvoices) {
      outputCgst += Number(inv.cgst_total || 0);
      outputSgst += Number(inv.sgst_total || 0);
      outputIgst += Number(inv.igst_total || 0);
      totalTaxableSales +=
        Number(inv.subtotal || 0) - Number(inv.discount_total || 0);
    }

    let inputCgst = 0;
    let inputSgst = 0;
    let inputIgst = 0;
    let totalTaxablePurchases = 0;

    for (const bill of purchaseInvoices) {
      inputCgst += Number(bill.cgst_total || 0);
      inputSgst += Number(bill.sgst_total || 0);
      inputIgst += Number(bill.igst_total || 0);
      totalTaxablePurchases +=
        Number(bill.subtotal || 0) - Number(bill.discount_total || 0);
    }

    const totalOutputLiability = outputCgst + outputSgst + outputIgst;
    const totalInputCredit = inputCgst + inputSgst + inputIgst;
    const netTaxPayable = totalOutputLiability - totalInputCredit;

    return {
      output_tax: {
        cgst: outputCgst,
        sgst: outputSgst,
        igst: outputIgst,
        total_output: totalOutputLiability,
        total_taxable_sales: totalTaxableSales,
      },
      input_tax_credit: {
        cgst: inputCgst,
        sgst: inputSgst,
        igst: inputIgst,
        total_itc: totalInputCredit,
        total_taxable_purchases: totalTaxablePurchases,
      },
      net_tax_payable: netTaxPayable > 0 ? netTaxPayable : 0,
      excess_itc_balance: netTaxPayable < 0 ? Math.abs(netTaxPayable) : 0,
    };
  }

  async getGstr1Payload(companyId: string) {
    const salesInvoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId, status: { not: 'CANCELLED' } },
    });

    const b2bInvoices: any[] = [];
    const b2cInvoices: any[] = [];

    for (const inv of salesInvoices) {
      const customer = await this.prisma.customers.findUnique({
        where: { id: inv.customer_id },
      });
      const items = await this.prisma.sales_invoice_items.findMany({
        where: { invoice_id: inv.id },
      });

      const formatted = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: customer?.name,
        customer_gstin: customer?.gstin,
        place_of_supply: inv.place_of_supply,
        is_inter_state: inv.is_inter_state,
        subtotal: Number(inv.subtotal),
        cgst_total: Number(inv.cgst_total),
        sgst_total: Number(inv.sgst_total),
        igst_total: Number(inv.igst_total),
        grand_total: Number(inv.grand_total),
        items: items.map((i) => ({
          hsn_sac: i.hsn_sac,
          description: i.description,
          quantity: Number(i.quantity),
          taxable_amount: Number(i.taxable_amount),
          gst_rate: Number(i.gst_rate),
          cgst: Number(i.cgst_amount),
          sgst: Number(i.sgst_amount),
          igst: Number(i.igst_amount),
        })),
      };

      if (customer?.gstin && customer.gstin.trim().length === 15) {
        b2bInvoices.push(formatted);
      } else {
        b2cInvoices.push(formatted);
      }
    }

    return {
      b2b_invoices: b2bInvoices,
      b2c_invoices: b2cInvoices,
      total_b2b: b2bInvoices.length,
      total_b2c: b2cInvoices.length,
    };
  }

  async getGstr3bPayload(companyId: string) {
    const summary = await this.getGstSummary(companyId);
    return {
      outward_taxable_supplies: {
        total_taxable_value: summary.output_tax.total_taxable_sales,
        integrated_tax: summary.output_tax.igst,
        central_tax: summary.output_tax.cgst,
        state_tax: summary.output_tax.sgst,
      },
      eligible_itc: {
        integrated_tax: summary.input_tax_credit.igst,
        central_tax: summary.input_tax_credit.cgst,
        state_tax: summary.input_tax_credit.sgst,
      },
      net_tax_payable: summary.net_tax_payable,
    };
  }
}

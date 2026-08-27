import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EinvoiceService {
  constructor(private prisma: PrismaService) {}

  async generatePayload(invoiceId: string) {
    const invoice = await this.prisma.sales_invoices.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException(
        `Sales invoice with ID ${invoiceId} not found`,
      );
    }

    const company = await this.prisma.companies.findUnique({
      where: { id: invoice.company_id },
    });

    const customer = await this.prisma.customers.findUnique({
      where: { id: invoice.customer_id },
    });

    const items = await this.prisma.sales_invoice_items.findMany({
      where: { invoice_id: invoiceId },
    });

    return {
      Version: '1.03',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: customer?.gstin ? 'B2B' : 'B2C',
        RegRev: 'N',
        IgstOnIntra: 'N',
      },
      DocDtls: {
        Typ: 'INV',
        No: invoice.invoice_number,
        Dt: invoice.invoice_date.toISOString().split('T')[0],
      },
      SellerDtls: {
        Gstin: company?.gstin || '29AAAAA0000A1Z5',
        LglNm: company?.legal_name || 'My Trading Firm',
        TrdNm: company?.trade_name || company?.legal_name,
        Addr1: company?.address || 'Main Street',
        Loc: company?.state || 'Bengaluru',
        Pin: company?.pincode ? Number(company.pincode) : 560001,
        Stcd: '29',
      },
      BuyerDtls: {
        Gstin: customer?.gstin || '29URPNR0000A1Z1',
        LglNm: customer?.legal_name || customer?.name,
        TrdNm: customer?.name,
        Pos: invoice.place_of_supply,
        Addr1: customer?.billing_address || 'Customer Address',
        Loc: customer?.state || 'Bengaluru',
        Pin: customer?.pincode ? Number(customer.pincode) : 560001,
        Stcd: '29',
      },
      ItemList: items.map((i, index) => ({
        SlNo: (index + 1).toString(),
        PrdDesc: i.description,
        IsServc: i.service_id ? 'Y' : 'N',
        HsnCd: i.hsn_sac || '8471',
        Qty: Number(i.quantity),
        FreeQty: 0,
        UnitPrice: Number(i.unit_price),
        TotAmt: Number(i.quantity) * Number(i.unit_price),
        Discount: Number(i.discount),
        AssAmt: Number(i.taxable_amount),
        GstRt: Number(i.gst_rate),
        IgstAmt: Number(i.igst_amount),
        CgstAmt: Number(i.cgst_amount),
        SgstAmt: Number(i.sgst_amount),
        TotItemVal: Number(i.total_amount),
      })),
      ValDtls: {
        AssVal: Number(invoice.subtotal) - Number(invoice.discount_total),
        CgstVal: Number(invoice.cgst_total),
        SgstVal: Number(invoice.sgst_total),
        IgstVal: Number(invoice.igst_total),
        TotInvVal: Number(invoice.grand_total),
      },
    };
  }

  async submitEInvoice(invoiceId: string) {
    const payload = await this.generatePayload(invoiceId);

    // Compute deterministic hash simulating IRN (64-character SHA-256)
    const rawData = `${payload.SellerDtls.Gstin}:${payload.DocDtls.No}:${payload.DocDtls.Dt}`;
    const irn = crypto.createHash('sha256').update(rawData).digest('hex');

    const ackNo = `1126${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const ackDate = new Date();

    const signedQrData = `GSTIN:${payload.SellerDtls.Gstin}|IRN:${irn}|ACK:${ackNo}|DATE:${ackDate.toISOString()}|VAL:${payload.ValDtls.TotInvVal}`;

    const record = await this.prisma.einvoice_records.upsert({
      where: { invoice_id: invoiceId },
      update: {
        irn: irn,
        ack_no: ackNo,
        ack_date: ackDate,
        signed_qr_code: signedQrData,
        status: 'SUCCESS',
        error_details: null,
      },
      create: {
        invoice_id: invoiceId,
        irn: irn,
        ack_no: ackNo,
        ack_date: ackDate,
        signed_qr_code: signedQrData,
        status: 'SUCCESS',
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        action: 'GENERATE_EINVOICE',
        entity: 'einvoice_records',
        entity_id: record.id,
        details: `Generated IRN ${irn.substring(0, 16)}... for Sales Invoice ID ${invoiceId}`,
      },
    });

    return {
      message: 'e-Invoice generated successfully',
      invoice_id: invoiceId,
      irn: irn,
      ack_no: ackNo,
      ack_date: ackDate,
      signed_qr_code: signedQrData,
      status: 'SUCCESS',
    };
  }

  async getEInvoice(invoiceId: string) {
    return this.prisma.einvoice_records.findUnique({
      where: { invoice_id: invoiceId },
    });
  }
}

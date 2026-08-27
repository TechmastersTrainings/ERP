import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class BulkImportCustomerDto {
  companyId: string;
  customers: {
    name: string;
    gstin?: string;
    email?: string;
    phone?: string;
    state?: string;
  }[];
}

export interface ImportedCustomerRecord {
  id: string;
  company_id: string;
  name: string;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  created_at: Date | null;
}

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  async exportSalesInvoicesCsv(companyId: string): Promise<string> {
    const invoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: companyId },
      orderBy: { invoice_date: 'desc' },
    });

    const header =
      'Invoice Number,Invoice Date,Place of Supply,Subtotal,CGST,SGST,IGST,Grand Total,Status\n';
    const rows = invoices
      .map(
        (i) =>
          `"${i.invoice_number}","${new Date(i.invoice_date).toISOString().substring(0, 10)}","${i.place_of_supply}",${Number(i.subtotal)},${Number(i.cgst_total)},${Number(i.sgst_total)},${Number(i.igst_total)},${Number(i.grand_total)},"${i.status}"`,
      )
      .join('\n');

    return header + rows;
  }

  async exportCustomersCsv(companyId: string): Promise<string> {
    const customers = await this.prisma.customers.findMany({
      where: { company_id: companyId },
    });

    const header = 'Customer Name,GSTIN,Email,Phone,State,Current Balance\n';
    const rows = customers
      .map(
        (c) =>
          `"${c.name}","${c.gstin || ''}","${c.email || ''}","${c.phone || ''}","${c.state || ''}",${Number(c.current_balance || 0)}`,
      )
      .join('\n');

    return header + rows;
  }

  async importCustomersBulk(dto: BulkImportCustomerDto) {
    const created: ImportedCustomerRecord[] = [];
    for (const c of dto.customers) {
      const rec = await this.prisma.customers.create({
        data: {
          company_id: dto.companyId,
          name: c.name,
          gstin: c.gstin || null,
          email: c.email || null,
          phone: c.phone || null,
          state: c.state || 'Karnataka',
        },
      });
      created.push(rec);
    }

    await this.prisma.audit_logs.create({
      data: {
        action: 'BULK_IMPORT_CUSTOMERS',
        entity: 'customers',
        details: `Bulk imported ${created.length} customer records via CSV engine`,
      },
    });

    return {
      imported_count: created.length,
      customers: created,
    };
  }
}

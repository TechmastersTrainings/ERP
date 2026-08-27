import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class SalesInvoiceItemDto {
  productId?: string;
  serviceId?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  gstRate: number;
}

export class CreateSalesInvoiceDto {
  companyId: string;
  branchId?: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string;
  placeOfSupply: string; // State name
  notes?: string;
  items: SalesInvoiceItemDto[];
}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSalesInvoiceDto) {
    const company = await this.prisma.companies.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${dto.companyId} not found`);
    }

    const customer = await this.prisma.customers.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${dto.customerId} not found`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Sales invoice must have at least one line item',
      );
    }

    const isInterState = company.state
      ? company.state.trim().toLowerCase() !==
        dto.placeOfSupply.trim().toLowerCase()
      : false;

    let subtotal = 0;
    let discountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const processedItems = dto.items.map((item) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const disc = item.discount || 0;
      const taxable = qty * price - disc;
      const rate = item.gstRate || 0;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = taxable * (rate / 100);
      } else {
        cgst = taxable * (rate / 200);
        sgst = taxable * (rate / 200);
      }

      const total = taxable + cgst + sgst + igst;

      subtotal += qty * price;
      discountTotal += disc;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        product_id: item.productId || null,
        service_id: item.serviceId || null,
        description: item.description,
        hsn_sac: item.hsnSac || null,
        quantity: qty,
        unit_price: price,
        discount: disc,
        taxable_amount: taxable,
        gst_rate: rate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: total,
      };
    });

    const grandTotal =
      subtotal - discountTotal + cgstTotal + sgstTotal + igstTotal;

    // Single Atomic DB Transaction for ERP Single-Entry Cascade
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sales Invoice Header
      const invoice = await tx.sales_invoices.create({
        data: {
          company_id: dto.companyId,
          branch_id: dto.branchId || null,
          customer_id: dto.customerId,
          invoice_number: dto.invoiceNumber,
          invoice_date: new Date(dto.invoiceDate),
          due_date: dto.dueDate ? new Date(dto.dueDate) : null,
          place_of_supply: dto.placeOfSupply,
          is_inter_state: isInterState,
          subtotal: subtotal,
          discount_total: discountTotal,
          cgst_total: cgstTotal,
          sgst_total: sgstTotal,
          igst_total: igstTotal,
          grand_total: grandTotal,
          amount_paid: 0,
          balance_due: grandTotal,
          status: 'UNPAID',
          notes: dto.notes || null,
        },
      });

      // 2. Create Invoice Items
      for (const item of processedItems) {
        await tx.sales_invoice_items.create({
          data: {
            invoice_id: invoice.id,
            ...item,
          },
        });

        // 3. Stock Outward Entry if item is a product
        if (item.product_id) {
          const product = await tx.products.findUnique({
            where: { id: item.product_id },
          });

          if (product && !product.is_service) {
            // Find current stock balance
            const lastLedger = await tx.stock_ledgers.findFirst({
              where: { company_id: dto.companyId, product_id: item.product_id },
              orderBy: { created_at: 'desc' },
            });

            const currentStock = lastLedger
              ? Number(lastLedger.balance_after)
              : 0;
            const newStock = currentStock - item.quantity;

            await tx.stock_ledgers.create({
              data: {
                company_id: dto.companyId,
                product_id: item.product_id,
                movement_type: 'OUTWARD',
                reference_type: 'SALES_INVOICE',
                reference_id: invoice.id,
                quantity: -item.quantity,
                unit_price: item.unit_price,
                balance_after: newStock,
              },
            });
          }
        }
      }

      // 4. Update Customer Accounts Receivable Balance
      const currentCustBalance = Number(customer.current_balance || 0);
      await tx.customers.update({
        where: { id: customer.id },
        data: {
          current_balance: currentCustBalance + grandTotal,
        },
      });

      // 5. Journal Entries for Accounting
      const entryDate = new Date(dto.invoiceDate);

      // Debit AR
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'SALES_INVOICE',
          reference_id: invoice.id,
          account_name: 'Accounts Receivable (Customer)',
          debit: grandTotal,
          credit: 0,
          narration: `Sales Invoice ${dto.invoiceNumber} to ${customer.name}`,
          entry_date: entryDate,
        },
      });

      // Credit Sales Revenue
      const netRevenue = subtotal - discountTotal;
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'SALES_INVOICE',
          reference_id: invoice.id,
          account_name: 'Sales Revenue',
          debit: 0,
          credit: netRevenue,
          narration: `Sales Revenue for Invoice ${dto.invoiceNumber}`,
          entry_date: entryDate,
        },
      });

      // Credit GST Liabilities
      if (cgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'SALES_INVOICE',
            reference_id: invoice.id,
            account_name: 'Output CGST Liability',
            debit: 0,
            credit: cgstTotal,
            narration: `Output CGST for Invoice ${dto.invoiceNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (sgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'SALES_INVOICE',
            reference_id: invoice.id,
            account_name: 'Output SGST Liability',
            debit: 0,
            credit: sgstTotal,
            narration: `Output SGST for Invoice ${dto.invoiceNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (igstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'SALES_INVOICE',
            reference_id: invoice.id,
            account_name: 'Output IGST Liability',
            debit: 0,
            credit: igstTotal,
            narration: `Output IGST for Invoice ${dto.invoiceNumber}`,
            entry_date: entryDate,
          },
        });
      }

      // 6. Audit Trail Log
      await tx.audit_logs.create({
        data: {
          organization_id: company.organization_id,
          action: 'CREATE_SALES_INVOICE',
          entity: 'sales_invoices',
          entity_id: invoice.id,
          details: `Created Sales Invoice ${dto.invoiceNumber} for ${customer.name} totaling ₹${grandTotal.toFixed(2)}`,
        },
      });

      return invoice;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.sales_invoices.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.sales_invoices.findUnique({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(`Sales invoice with ID ${id} not found`);
    }
    const items = await this.prisma.sales_invoice_items.findMany({
      where: { invoice_id: id },
    });
    const customer = await this.prisma.customers.findUnique({
      where: { id: invoice.customer_id },
    });
    return { ...invoice, items, customer };
  }
}

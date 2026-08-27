import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class PurchaseInvoiceItemDto {
  productId?: string;
  serviceId?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  gstRate: number;
}

export class CreatePurchaseInvoiceDto {
  companyId: string;
  branchId?: string;
  supplierId: string;
  billNumber: string;
  billDate: string; // YYYY-MM-DD
  dueDate?: string;
  placeOfSupply: string; // State name
  notes?: string;
  items: PurchaseInvoiceItemDto[];
}

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseInvoiceDto) {
    const company = await this.prisma.companies.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${dto.companyId} not found`);
    }

    const supplier = await this.prisma.suppliers.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(
        `Supplier with ID ${dto.supplierId} not found`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Purchase bill must have at least one line item',
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

    // Single Atomic DB Transaction for ERP Purchase Single-Entry Cascade
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Purchase Bill Header
      const bill = await tx.purchase_invoices.create({
        data: {
          company_id: dto.companyId,
          branch_id: dto.branchId || null,
          supplier_id: dto.supplierId,
          bill_number: dto.billNumber,
          bill_date: new Date(dto.billDate),
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

      // 2. Create Bill Line Items
      for (const item of processedItems) {
        await tx.purchase_invoice_items.create({
          data: {
            bill_id: bill.id,
            ...item,
          },
        });

        // 3. Stock Inward Entry if item is a product
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
            const newStock = currentStock + item.quantity;

            await tx.stock_ledgers.create({
              data: {
                company_id: dto.companyId,
                product_id: item.product_id,
                movement_type: 'INWARD',
                reference_type: 'PURCHASE_INVOICE',
                reference_id: bill.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                balance_after: newStock,
              },
            });
          }
        }
      }

      // 4. Update Supplier Accounts Payable Balance
      const currentSuppBalance = Number(supplier.current_balance || 0);
      await tx.suppliers.update({
        where: { id: supplier.id },
        data: {
          current_balance: currentSuppBalance + grandTotal,
        },
      });

      // 5. Journal Entries for Accounting
      const entryDate = new Date(dto.billDate);
      const netPurchase = subtotal - discountTotal;

      // Debit Inventory Asset / Purchase Expense
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PURCHASE_INVOICE',
          reference_id: bill.id,
          account_name: 'Inventory Asset / Purchase Expense',
          debit: netPurchase,
          credit: 0,
          narration: `Purchase Bill ${dto.billNumber} from ${supplier.name}`,
          entry_date: entryDate,
        },
      });

      // Debit Input GST Tax Credit (ITC Asset)
      if (cgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PURCHASE_INVOICE',
            reference_id: bill.id,
            account_name: 'Input CGST Asset',
            debit: cgstTotal,
            credit: 0,
            narration: `Input CGST for Bill ${dto.billNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (sgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PURCHASE_INVOICE',
            reference_id: bill.id,
            account_name: 'Input SGST Asset',
            debit: sgstTotal,
            credit: 0,
            narration: `Input SGST for Bill ${dto.billNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (igstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PURCHASE_INVOICE',
            reference_id: bill.id,
            account_name: 'Input IGST Asset',
            debit: igstTotal,
            credit: 0,
            narration: `Input IGST for Bill ${dto.billNumber}`,
            entry_date: entryDate,
          },
        });
      }

      // Credit Supplier Accounts Payable
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PURCHASE_INVOICE',
          reference_id: bill.id,
          account_name: 'Accounts Payable (Supplier)',
          debit: 0,
          credit: grandTotal,
          narration: `Accounts Payable for Purchase Bill ${dto.billNumber}`,
          entry_date: entryDate,
        },
      });

      // 6. Audit Trail Log
      await tx.audit_logs.create({
        data: {
          organization_id: company.organization_id,
          action: 'CREATE_PURCHASE_INVOICE',
          entity: 'purchase_invoices',
          entity_id: bill.id,
          details: `Recorded Purchase Bill ${dto.billNumber} from ${supplier.name} totaling ₹${grandTotal.toFixed(2)}`,
        },
      });

      return bill;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.purchase_invoices.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.purchase_invoices.findUnique({
      where: { id },
    });
    if (!bill) {
      throw new NotFoundException(`Purchase bill with ID ${id} not found`);
    }
    const items = await this.prisma.purchase_invoice_items.findMany({
      where: { bill_id: id },
    });
    const supplier = await this.prisma.suppliers.findUnique({
      where: { id: bill.supplier_id },
    });
    return { ...bill, items, supplier };
  }
}

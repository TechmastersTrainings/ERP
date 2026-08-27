import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreditNoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export class CreateCreditNoteDto {
  companyId: string;
  customerId: string;
  invoiceId?: string;
  creditNoteNumber: string;
  noteDate: string; // YYYY-MM-DD
  reason: string;
  restockInventory?: boolean;
  items: CreditNoteItemDto[];
}

@Injectable()
export class CreditNotesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCreditNoteDto) {
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
        'Credit Note must have at least one line item',
      );
    }

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    const igstTotal = 0;

    const restock = dto.restockInventory !== false;

    const processedItems = dto.items.map((item) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const taxable = qty * price;
      const rate = item.gstRate || 0;

      const cgst = taxable * (rate / 200);
      const sgst = taxable * (rate / 200);
      const total = taxable + cgst + sgst;

      subtotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;

      return {
        product_id: item.productId || null,
        description: item.description,
        quantity: qty,
        unit_price: price,
        taxable_amount: taxable,
        gst_rate: rate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: 0,
        total_amount: total,
      };
    });

    const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Credit Note Record
      const note = await tx.credit_notes.create({
        data: {
          company_id: dto.companyId,
          customer_id: dto.customerId,
          invoice_id: dto.invoiceId || null,
          credit_note_number: dto.creditNoteNumber,
          note_date: new Date(dto.noteDate),
          reason: dto.reason,
          subtotal: subtotal,
          cgst_total: cgstTotal,
          sgst_total: sgstTotal,
          igst_total: igstTotal,
          grand_total: grandTotal,
          restock_inventory: restock,
        },
      });

      // 2. Create Credit Note Items
      for (const item of processedItems) {
        await tx.credit_note_items.create({
          data: {
            credit_note_id: note.id,
            ...item,
          },
        });

        // 3. Restock inventory if requested
        if (restock && item.product_id) {
          const product = await tx.products.findUnique({
            where: { id: item.product_id },
          });

          if (product && !product.is_service) {
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
                reference_type: 'CREDIT_NOTE',
                reference_id: note.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                balance_after: newStock,
              },
            });
          }
        }
      }

      // 4. Decrement Customer Accounts Receivable Balance
      const currentCustBalance = Number(customer.current_balance || 0);
      await tx.customers.update({
        where: { id: customer.id },
        data: {
          current_balance: currentCustBalance - grandTotal,
        },
      });

      // 5. Journal Entries for Tax & Sales Return Reversal
      const entryDate = new Date(dto.noteDate);

      // Debit Sales Return Account
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'CREDIT_NOTE',
          reference_id: note.id,
          account_name: 'Sales Returns & Allowances',
          debit: subtotal,
          credit: 0,
          narration: `Credit Note ${dto.creditNoteNumber} for ${customer.name}`,
          entry_date: entryDate,
        },
      });

      // Debit Output Tax Liability Reversals
      if (cgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'CREDIT_NOTE',
            reference_id: note.id,
            account_name: 'Output CGST Liability',
            debit: cgstTotal,
            credit: 0,
            narration: `Output CGST Reversal for Credit Note ${dto.creditNoteNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (sgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'CREDIT_NOTE',
            reference_id: note.id,
            account_name: 'Output SGST Liability',
            debit: sgstTotal,
            credit: 0,
            narration: `Output SGST Reversal for Credit Note ${dto.creditNoteNumber}`,
            entry_date: entryDate,
          },
        });
      }

      // Credit Customer AR
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'CREDIT_NOTE',
          reference_id: note.id,
          account_name: 'Accounts Receivable (Customer)',
          debit: 0,
          credit: grandTotal,
          narration: `Credit AR for customer ${customer.name} via Credit Note`,
          entry_date: entryDate,
        },
      });

      // 6. Audit Log
      await tx.audit_logs.create({
        data: {
          action: 'CREATE_CREDIT_NOTE',
          entity: 'credit_notes',
          entity_id: note.id,
          details: `Issued Credit Note ${dto.creditNoteNumber} to ${customer.name} totaling ₹${grandTotal.toFixed(2)}. Reason: ${dto.reason}`,
        },
      });

      return note;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.credit_notes.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}

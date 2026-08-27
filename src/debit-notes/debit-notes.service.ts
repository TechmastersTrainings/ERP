import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class DebitNoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export class CreateDebitNoteDto {
  companyId: string;
  supplierId: string;
  billId?: string;
  debitNoteNumber: string;
  noteDate: string; // YYYY-MM-DD
  reason: string;
  returnInventory?: boolean;
  items: DebitNoteItemDto[];
}

@Injectable()
export class DebitNotesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDebitNoteDto) {
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
        'Debit Note must have at least one line item',
      );
    }

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    const igstTotal = 0;

    const returnStock = dto.returnInventory !== false;

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
      // 1. Create Debit Note Record
      const note = await tx.debit_notes.create({
        data: {
          company_id: dto.companyId,
          supplier_id: dto.supplierId,
          bill_id: dto.billId || null,
          debit_note_number: dto.debitNoteNumber,
          note_date: new Date(dto.noteDate),
          reason: dto.reason,
          subtotal: subtotal,
          cgst_total: cgstTotal,
          sgst_total: sgstTotal,
          igst_total: igstTotal,
          grand_total: grandTotal,
          return_inventory: returnStock,
        },
      });

      // 2. Create Debit Note Items
      for (const item of processedItems) {
        await tx.debit_note_items.create({
          data: {
            debit_note_id: note.id,
            ...item,
          },
        });

        // 3. Outward inventory return if requested
        if (returnStock && item.product_id) {
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
            const newStock = currentStock - item.quantity;

            await tx.stock_ledgers.create({
              data: {
                company_id: dto.companyId,
                product_id: item.product_id,
                movement_type: 'OUTWARD',
                reference_type: 'DEBIT_NOTE',
                reference_id: note.id,
                quantity: -item.quantity,
                unit_price: item.unit_price,
                balance_after: newStock,
              },
            });
          }
        }
      }

      // 4. Decrement Supplier Accounts Payable Balance
      const currentSuppBalance = Number(supplier.current_balance || 0);
      await tx.suppliers.update({
        where: { id: supplier.id },
        data: {
          current_balance: currentSuppBalance - grandTotal,
        },
      });

      // 5. Journal Entries for Tax & Purchase Return Reversal
      const entryDate = new Date(dto.noteDate);

      // Debit Supplier AP
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'DEBIT_NOTE',
          reference_id: note.id,
          account_name: 'Accounts Payable (Supplier)',
          debit: grandTotal,
          credit: 0,
          narration: `Debit AP for Debit Note ${dto.debitNoteNumber}`,
          entry_date: entryDate,
        },
      });

      // Credit Purchase Return Account
      await tx.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'DEBIT_NOTE',
          reference_id: note.id,
          account_name: 'Purchase Returns & Adjustments',
          debit: 0,
          credit: subtotal,
          narration: `Purchase Return for Debit Note ${dto.debitNoteNumber}`,
          entry_date: entryDate,
        },
      });

      // Credit Input Tax Credit Asset Reversals
      if (cgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'DEBIT_NOTE',
            reference_id: note.id,
            account_name: 'Input CGST Asset',
            debit: 0,
            credit: cgstTotal,
            narration: `Input CGST Reversal for Debit Note ${dto.debitNoteNumber}`,
            entry_date: entryDate,
          },
        });
      }

      if (sgstTotal > 0) {
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'DEBIT_NOTE',
            reference_id: note.id,
            account_name: 'Input SGST Asset',
            debit: 0,
            credit: sgstTotal,
            narration: `Input SGST Reversal for Debit Note ${dto.debitNoteNumber}`,
            entry_date: entryDate,
          },
        });
      }

      // 6. Audit Log
      await tx.audit_logs.create({
        data: {
          action: 'CREATE_DEBIT_NOTE',
          entity: 'debit_notes',
          entity_id: note.id,
          details: `Issued Debit Note ${dto.debitNoteNumber} to ${supplier.name} totaling ₹${grandTotal.toFixed(2)}. Reason: ${dto.reason}`,
        },
      });

      return note;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.debit_notes.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}

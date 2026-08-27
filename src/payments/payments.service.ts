import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreatePaymentDto {
  companyId: string;
  paymentType: 'RECEIPT' | 'VOUCHER';
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  billId?: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  referenceNumber?: string;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    if (dto.paymentType === 'RECEIPT') {
      if (!dto.customerId) {
        throw new BadRequestException(
          'Customer ID is required for Payment Receipt',
        );
      }
      const customer = await this.prisma.customers.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${dto.customerId} not found`,
        );
      }

      return this.prisma.$transaction(async (tx) => {
        // 1. Create Payment Record
        const payment = await tx.payment_records.create({
          data: {
            company_id: dto.companyId,
            payment_type: 'RECEIPT',
            customer_id: dto.customerId,
            invoice_id: dto.invoiceId || null,
            amount: dto.amount,
            payment_date: new Date(dto.paymentDate),
            payment_mode: dto.paymentMode,
            reference_number: dto.referenceNumber || null,
            notes: dto.notes || null,
          },
        });

        // 2. Decrement Customer Current Balance (AR)
        const currentCustBalance = Number(customer.current_balance || 0);
        await tx.customers.update({
          where: { id: dto.customerId },
          data: {
            current_balance: currentCustBalance - dto.amount,
          },
        });

        // 3. Update Invoice Balance & Status if invoiceId is provided
        if (dto.invoiceId) {
          const invoice = await tx.sales_invoices.findUnique({
            where: { id: dto.invoiceId },
          });

          if (invoice) {
            const currentPaid = Number(invoice.amount_paid || 0);
            const grandTotal = Number(invoice.grand_total);
            const newPaid = currentPaid + dto.amount;
            const newBalance = grandTotal - newPaid;
            const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

            await tx.sales_invoices.update({
              where: { id: dto.invoiceId },
              data: {
                amount_paid: newPaid,
                balance_due: newBalance > 0 ? newBalance : 0,
                status: status,
              },
            });
          }
        }

        // 4. Double-Entry Journal Record
        const entryDate = new Date(dto.paymentDate);
        const bankOrCashAccount =
          dto.paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank Account';

        // Debit Cash/Bank
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PAYMENT_RECEIPT',
            reference_id: payment.id,
            account_name: bankOrCashAccount,
            debit: dto.amount,
            credit: 0,
            narration: `Payment Receipt from ${customer.name} via ${dto.paymentMode}`,
            entry_date: entryDate,
          },
        });

        // Credit Accounts Receivable
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PAYMENT_RECEIPT',
            reference_id: payment.id,
            account_name: 'Accounts Receivable (Customer)',
            debit: 0,
            credit: dto.amount,
            narration: `Credit AR for customer ${customer.name}`,
            entry_date: entryDate,
          },
        });

        // 5. Audit Log
        await tx.audit_logs.create({
          data: {
            action: 'CREATE_PAYMENT_RECEIPT',
            entity: 'payment_records',
            entity_id: payment.id,
            details: `Received ₹${dto.amount.toFixed(2)} from ${customer.name} via ${dto.paymentMode}`,
          },
        });

        return payment;
      });
    } else {
      // VOUCHER (Payment to Supplier)
      if (!dto.supplierId) {
        throw new BadRequestException(
          'Supplier ID is required for Payment Voucher',
        );
      }
      const supplier = await this.prisma.suppliers.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(
          `Supplier with ID ${dto.supplierId} not found`,
        );
      }

      return this.prisma.$transaction(async (tx) => {
        // 1. Create Payment Record
        const payment = await tx.payment_records.create({
          data: {
            company_id: dto.companyId,
            payment_type: 'VOUCHER',
            supplier_id: dto.supplierId,
            bill_id: dto.billId || null,
            amount: dto.amount,
            payment_date: new Date(dto.paymentDate),
            payment_mode: dto.paymentMode,
            reference_number: dto.referenceNumber || null,
            notes: dto.notes || null,
          },
        });

        // 2. Decrement Supplier Current Balance (AP)
        const currentSuppBalance = Number(supplier.current_balance || 0);
        await tx.suppliers.update({
          where: { id: dto.supplierId },
          data: {
            current_balance: currentSuppBalance - dto.amount,
          },
        });

        // 3. Update Purchase Bill Balance & Status if billId is provided
        if (dto.billId) {
          const bill = await tx.purchase_invoices.findUnique({
            where: { id: dto.billId },
          });

          if (bill) {
            const currentPaid = Number(bill.amount_paid || 0);
            const grandTotal = Number(bill.grand_total);
            const newPaid = currentPaid + dto.amount;
            const newBalance = grandTotal - newPaid;
            const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

            await tx.purchase_invoices.update({
              where: { id: dto.billId },
              data: {
                amount_paid: newPaid,
                balance_due: newBalance > 0 ? newBalance : 0,
                status: status,
              },
            });
          }
        }

        // 4. Double-Entry Journal Record
        const entryDate = new Date(dto.paymentDate);
        const bankOrCashAccount =
          dto.paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank Account';

        // Debit Accounts Payable
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PAYMENT_VOUCHER',
            reference_id: payment.id,
            account_name: 'Accounts Payable (Supplier)',
            debit: dto.amount,
            credit: 0,
            narration: `Debit AP for supplier ${supplier.name}`,
            entry_date: entryDate,
          },
        });

        // Credit Cash/Bank
        await tx.journal_entries.create({
          data: {
            company_id: dto.companyId,
            reference_type: 'PAYMENT_VOUCHER',
            reference_id: payment.id,
            account_name: bankOrCashAccount,
            debit: 0,
            credit: dto.amount,
            narration: `Paid ${supplier.name} via ${dto.paymentMode}`,
            entry_date: entryDate,
          },
        });

        // 5. Audit Log
        await tx.audit_logs.create({
          data: {
            action: 'CREATE_PAYMENT_VOUCHER',
            entity: 'payment_records',
            entity_id: payment.id,
            details: `Paid ₹${dto.amount.toFixed(2)} to ${supplier.name} via ${dto.paymentMode}`,
          },
        });

        return payment;
      });
    }
  }

  async findAll(companyId: string) {
    return this.prisma.payment_records.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}

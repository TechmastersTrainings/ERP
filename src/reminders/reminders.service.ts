import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async sendPaymentReminder(dto: {
    companyId: string;
    customerId: string;
    invoiceId: string;
    reminderType?: string;
  }) {
    const inv = await this.prisma.sales_invoices.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!inv) {
      throw new NotFoundException('Sales Invoice not found');
    }

    const reminder = await this.prisma.payment_reminders.create({
      data: {
        company_id: dto.companyId,
        customer_id: dto.customerId,
        invoice_id: dto.invoiceId,
        reminder_type: dto.reminderType || 'EMAIL_WHATSAPP',
        status: 'SENT',
      },
    });

    return {
      message: `Payment reminder sent successfully for Invoice ${inv.invoice_number} (Balance Due: ₹${Number(inv.balance_due).toFixed(2)})`,
      reminderId: reminder.id,
      invoiceNumber: inv.invoice_number,
      balanceDue: Number(inv.balance_due),
    };
  }

  async getReminderLogs(companyId: string) {
    return this.prisma.payment_reminders.findMany({
      where: { company_id: companyId },
      orderBy: { sent_at: 'desc' },
    });
  }
}

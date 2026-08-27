import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('send')
  async sendReminder(
    @Body()
    body: {
      companyId: string;
      customerId: string;
      invoiceId: string;
      reminderType?: string;
    },
  ) {
    return this.remindersService.sendPaymentReminder(body);
  }

  @Get()
  async getLogs(@Query('companyId') companyId: string) {
    return this.remindersService.getReminderLogs(companyId || '');
  }
}

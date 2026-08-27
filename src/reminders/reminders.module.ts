import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { RemindersController } from './reminders.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [RemindersController],
  providers: [RemindersService, PrismaService],
  exports: [RemindersService],
})
export class RemindersModule {}

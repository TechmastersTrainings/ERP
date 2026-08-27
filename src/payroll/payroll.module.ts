import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service.js';
import { PayrollController } from './payroll.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PrismaService],
  exports: [PayrollService],
})
export class PayrollModule {}

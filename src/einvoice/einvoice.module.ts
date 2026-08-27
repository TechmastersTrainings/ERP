import { Module } from '@nestjs/common';
import { EinvoiceService } from './einvoice.service';
import { EinvoiceController } from './einvoice.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EinvoiceController],
  providers: [EinvoiceService],
  exports: [EinvoiceService],
})
export class EinvoiceModule {}

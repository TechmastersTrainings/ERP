import { Module } from '@nestjs/common';
import { EwaybillService } from './ewaybill.service';
import { EwaybillController } from './ewaybill.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EwaybillController],
  providers: [EwaybillService],
  exports: [EwaybillService],
})
export class EwaybillModule {}

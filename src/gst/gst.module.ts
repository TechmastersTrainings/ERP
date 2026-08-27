import { Module } from '@nestjs/common';
import { GstService } from './gst.service';
import { GstController } from './gst.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GstController],
  providers: [GstService],
  exports: [GstService],
})
export class GstModule {}

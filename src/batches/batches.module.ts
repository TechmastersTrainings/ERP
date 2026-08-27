import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service.js';
import { BatchesController } from './batches.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [BatchesController],
  providers: [BatchesService, PrismaService],
  exports: [BatchesService],
})
export class BatchesModule {}

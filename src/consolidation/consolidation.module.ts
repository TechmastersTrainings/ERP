import { Module } from '@nestjs/common';
import { ConsolidationService } from './consolidation.service.js';
import { ConsolidationController } from './consolidation.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ConsolidationController],
  providers: [ConsolidationService, PrismaService],
  exports: [ConsolidationService],
})
export class ConsolidationModule {}

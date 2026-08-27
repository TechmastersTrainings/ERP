import { Module } from '@nestjs/common';
import { ProductionService } from './production.service.js';
import { ProductionController } from './production.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, PrismaService],
  exports: [ProductionService],
})
export class ProductionModule {}

import { Module } from '@nestjs/common';
import { ForexService } from './forex.service.js';
import { ForexController } from './forex.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ForexController],
  providers: [ForexService, PrismaService],
  exports: [ForexService],
})
export class ForexModule {}

import { Module } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service.js';
import { FixedAssetsController } from './fixed-assets.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [FixedAssetsController],
  providers: [FixedAssetsService, PrismaService],
  exports: [FixedAssetsService],
})
export class FixedAssetsModule {}

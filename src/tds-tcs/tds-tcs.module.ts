import { Module } from '@nestjs/common';
import { TdsTcsService } from './tds-tcs.service.js';
import { TdsTcsController } from './tds-tcs.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [TdsTcsController],
  providers: [TdsTcsService, PrismaService],
  exports: [TdsTcsService],
})
export class TdsTcsModule {}

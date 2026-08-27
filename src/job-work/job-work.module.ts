import { Module } from '@nestjs/common';
import { JobWorkService } from './job-work.service.js';
import { JobWorkController } from './job-work.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [JobWorkController],
  providers: [JobWorkService, PrismaService],
  exports: [JobWorkService],
})
export class JobWorkModule {}

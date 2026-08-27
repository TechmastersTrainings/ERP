import { Module } from '@nestjs/common';
import { Gstr9Service } from './gstr9.service.js';
import { Gstr9Controller } from './gstr9.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [Gstr9Controller],
  providers: [Gstr9Service, PrismaService],
  exports: [Gstr9Service],
})
export class Gstr9Module {}

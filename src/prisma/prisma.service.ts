import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const rawUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:Fri10Feb%402023@db.zttjntjinunlhqlhueci.supabase.co:6543/postgres';
    const connectionString = rawUrl.includes('@2023@')
      ? rawUrl.replace('Fri10Feb@2023', 'Fri10Feb%402023')
      : rawUrl;

    const adapter = new PrismaPg({
      connectionString,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

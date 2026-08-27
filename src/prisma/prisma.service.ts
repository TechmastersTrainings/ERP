import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const rawUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:Fri10Feb%402023@db.zttjntjinunlhqlhueci.supabase.co:5432/postgres?sslmode=require';
    const connectionString = rawUrl.includes('@2023@')
      ? rawUrl.replace('Fri10Feb@2023', 'Fri10Feb%402023')
      : rawUrl;

    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

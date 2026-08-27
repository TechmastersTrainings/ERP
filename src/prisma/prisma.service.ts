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
      'postgresql://postgres:Fri10Feb%402023@db.zttjntjinunlhqlhueci.supabase.co:5432/postgres';

    // 1. Strip query string (e.g. ?sslmode=require) so pg-connection-string won't override rejectUnauthorized: false
    let connectionString = rawUrl.split('?')[0];

    // 2. Fix unencoded password @ character
    if (connectionString.includes('Fri10Feb@2023')) {
      connectionString = connectionString.replace(
        'Fri10Feb@2023',
        'Fri10Feb%402023',
      );
    }

    // 3. Force port 5432 if port 6543 is specified on db.supabase.co
    if (connectionString.includes(':6543')) {
      connectionString = connectionString.replace(':6543', ':5432');
    }

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

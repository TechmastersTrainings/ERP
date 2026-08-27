import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    const count = await this.prisma.organizations.count();
    return `Connected to Supabase! Total organizations in database: ${count}`;
  }
}

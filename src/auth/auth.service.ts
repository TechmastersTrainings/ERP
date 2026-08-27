import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/register.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  // Seed mandatory Super Admin account: Techmastersinnocations@gmail.com / Fri10Feb@2023
  private async seedSuperAdmin() {
    const adminEmail = 'techmastersinnocations@gmail.com';
    const existing = await this.prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash('Fri10Feb@2023', 10);
      const org = await this.prisma.organizations.create({
        data: {
          name: 'Techmasters Innovations HQ',
          owner_email: adminEmail,
          status: 'APPROVED',
          subscription_plan: 'ENTERPRISE',
        },
      });

      await this.prisma.companies.create({
        data: {
          organization_id: org.id,
          legal_name: 'Techmasters Innovations Private Limited',
          trade_name: 'Techmasters ERP HQ',
          gstin: '29AAAAA0000A1Z5',
          state: 'Karnataka',
          address:
            '1st Floor, Near Guru Nanak Dev Engg College, Mailoor Road, Bidar - 585403',
        },
      });

      await this.prisma.users.create({
        data: {
          organization_id: org.id,
          email: adminEmail,
          password_hash: passwordHash,
          full_name: 'Techmasters Super Admin',
          role: 'SUPER_ADMIN',
          is_active: true,
        },
      });
    }
  }

  async register(dto: RegisterDto) {
    const emailLower = dto.ownerEmail.toLowerCase();
    const existingUser = await this.prisma.users.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new ConflictException('User email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organizations.create({
        data: {
          name: dto.organizationName,
          owner_email: emailLower,
          status: 'PENDING_APPROVAL',
        },
      });

      const company = await tx.companies.create({
        data: {
          organization_id: org.id,
          legal_name: dto.organizationName,
          trade_name: dto.tradeName || dto.organizationName,
          gstin: dto.gstin,
          state: dto.state,
          address: dto.phone ? `Phone: ${dto.phone}` : null,
        },
      });

      const user = await tx.users.create({
        data: {
          organization_id: org.id,
          email: emailLower,
          password_hash: passwordHash,
          full_name: dto.fullName,
          role: 'ADMIN',
          is_active: true,
        },
      });

      await tx.tenant_subscriptions.create({
        data: {
          organization_id: org.id,
          plan_code: 'FREE',
          status: 'PENDING',
        },
      });

      return {
        message:
          'Registration submitted successfully. Account is pending Super Admin approval.',
        organizationId: org.id,
        companyId: company.id,
        userId: user.id,
        email: user.email,
        status: 'PENDING_APPROVAL',
      };
    });
  }

  async login(dto: LoginDto) {
    const emailLower = dto.email.toLowerCase();
    const user = await this.prisma.users.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new ForbiddenException('User account is inactive');
    }

    // Super Admin bypasses approval check
    if (user.role !== 'SUPER_ADMIN' && user.organization_id) {
      const org = await this.prisma.organizations.findUnique({
        where: { id: user.organization_id },
      });

      if (!org || org.status === 'PENDING_APPROVAL') {
        throw new ForbiddenException(
          'Your business registration is pending Super Admin approval. Please contact Techmasters Innovations.',
        );
      }
    }

    const company = await this.prisma.companies.findFirst({
      where: { organization_id: user.organization_id || undefined },
    });

    return {
      userId: user.id,
      organizationId: user.organization_id,
      companyId: company?.id || null,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };
  }
}

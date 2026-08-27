import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSupplierDto {
  companyId: string;
  name: string;
  legalName?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  pincode?: string;
  openingBalance?: number;
}

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.suppliers.create({
      data: {
        company_id: dto.companyId,
        name: dto.name,
        legal_name: dto.legalName,
        gstin: dto.gstin,
        pan: dto.pan,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        state: dto.state,
        pincode: dto.pincode,
        opening_balance: dto.openingBalance || 0,
        current_balance: dto.openingBalance || 0,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.suppliers.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.suppliers.findUnique({
      where: { id },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }
}

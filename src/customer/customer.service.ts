import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateCustomerDto {
  companyId: string;
  name: string;
  legalName?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  state?: string;
  pincode?: string;
  openingBalance?: number;
}

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.customers.create({
      data: {
        company_id: dto.companyId,
        name: dto.name,
        legal_name: dto.legalName,
        gstin: dto.gstin,
        pan: dto.pan,
        email: dto.email,
        phone: dto.phone,
        billing_address: dto.billingAddress,
        shipping_address: dto.shippingAddress,
        state: dto.state,
        pincode: dto.pincode,
        opening_balance: dto.openingBalance || 0,
        current_balance: dto.openingBalance || 0,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.customers.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customers.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.products.create({
      data: {
        company_id: dto.companyId,
        name: dto.name,
        sku: dto.sku,
        hsn_code: dto.hsn_code,
        unit: dto.unit,
        gst_rate: dto.gst_rate,
        purchase_price: dto.purchase_price,
        selling_price: dto.selling_price,
        is_service: dto.is_service,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.products.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class GenerateEWayBillDto {
  invoiceId: string;
  transporterId?: string;
  vehicleNumber: string;
  distanceKm: number;
}

@Injectable()
export class EwaybillService {
  constructor(private prisma: PrismaService) {}

  async generateEWayBill(dto: GenerateEWayBillDto) {
    const invoice = await this.prisma.sales_invoices.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException(
        `Sales invoice with ID ${dto.invoiceId} not found`,
      );
    }

    const ewbNumber = `3310${Math.floor(10000000 + Math.random() * 90000000)}`;
    const ewbDate = new Date();

    // Validity: 1 day for every 200 km (minimum 1 day)
    const validDays = Math.max(1, Math.ceil(dto.distanceKm / 200));
    const validTill = new Date(
      ewbDate.getTime() + validDays * 24 * 60 * 60 * 1000,
    );

    const record = await this.prisma.ewaybill_records.upsert({
      where: { invoice_id: dto.invoiceId },
      update: {
        ewb_number: ewbNumber,
        ewb_date: ewbDate,
        valid_till: validTill,
        transporter_id: dto.transporterId || null,
        vehicle_number: dto.vehicleNumber,
        distance_km: dto.distanceKm,
        status: 'GENERATED',
      },
      create: {
        invoice_id: dto.invoiceId,
        ewb_number: ewbNumber,
        ewb_date: ewbDate,
        valid_till: validTill,
        transporter_id: dto.transporterId || null,
        vehicle_number: dto.vehicleNumber,
        distance_km: dto.distanceKm,
        status: 'GENERATED',
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        action: 'GENERATE_EWAY_BILL',
        entity: 'ewaybill_records',
        entity_id: record.id,
        details: `Issued E-Way Bill No ${ewbNumber} for Vehicle ${dto.vehicleNumber} (${dto.distanceKm} km)`,
      },
    });

    return record;
  }

  async getEWayBill(invoiceId: string) {
    return this.prisma.ewaybill_records.findUnique({
      where: { invoice_id: invoiceId },
    });
  }
}

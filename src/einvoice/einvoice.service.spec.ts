import { Test, TestingModule } from '@nestjs/testing';
import { EinvoiceService } from './einvoice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EinvoiceService', () => {
  let service: EinvoiceService;

  const mockInvoice = {
    id: 'inv-1',
    company_id: 'comp-1',
    customer_id: 'cust-1',
    invoice_number: 'INV-001',
    invoice_date: new Date('2026-08-27'),
    place_of_supply: 'Karnataka',
    subtotal: 1000,
    discount_total: 0,
    cgst_total: 90,
    sgst_total: 90,
    igst_total: 0,
    grand_total: 1180,
  };

  const mockCompany = {
    id: 'comp-1',
    gstin: '29AAAAA0000A1Z5',
    legal_name: 'Company A',
  };
  const mockCustomer = {
    id: 'cust-1',
    gstin: '29BBBBB0000B1Z5',
    name: 'Customer B',
  };
  const mockItem = {
    description: 'Item 1',
    quantity: 10,
    unit_price: 100,
    discount: 0,
    taxable_amount: 1000,
    gst_rate: 18,
    cgst_amount: 90,
    sgst_amount: 90,
    igst_amount: 0,
    total_amount: 1180,
  };

  const mockRecord = {
    id: 'einv-1',
    invoice_id: 'inv-1',
    irn: '64charhash...',
    status: 'SUCCESS',
  };

  const prismaMock = {
    sales_invoices: { findUnique: jest.fn().mockResolvedValue(mockInvoice) },
    companies: { findUnique: jest.fn().mockResolvedValue(mockCompany) },
    customers: { findUnique: jest.fn().mockResolvedValue(mockCustomer) },
    sales_invoice_items: { findMany: jest.fn().mockResolvedValue([mockItem]) },
    einvoice_records: { upsert: jest.fn().mockResolvedValue(mockRecord) },
    audit_logs: { create: jest.fn().mockResolvedValue({}) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EinvoiceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EinvoiceService>(EinvoiceService);
  });

  it('should generate compliant e-Invoice payload and issue IRN', async () => {
    const result = await service.submitEInvoice('inv-1');
    expect(result.status).toBe('SUCCESS');
    expect(result.irn).toHaveLength(64);
  });
});

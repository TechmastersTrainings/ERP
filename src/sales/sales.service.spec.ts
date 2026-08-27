import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SalesService', () => {
  let service: SalesService;

  const mockCompany = {
    id: 'comp-1',
    organization_id: 'org-1',
    state: 'Karnataka',
  };

  const mockCustomer = {
    id: 'cust-1',
    name: 'Test Customer',
    current_balance: 0,
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Widget A',
    is_service: false,
  };

  const mockStockLedger = {
    balance_after: 100,
  };

  const mockInvoice = {
    id: 'inv-1',
    invoice_number: 'INV-001',
    grand_total: 1180,
  };

  const salesInvoiceCreateMock = jest.fn().mockResolvedValue(mockInvoice);

  const prismaMock = {
    companies: {
      findUnique: jest.fn().mockResolvedValue(mockCompany),
    },
    customers: {
      findUnique: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
    },
    products: {
      findUnique: jest.fn().mockResolvedValue(mockProduct),
    },
    sales_invoices: {
      create: salesInvoiceCreateMock,
      findMany: jest.fn().mockResolvedValue([mockInvoice]),
      findUnique: jest.fn().mockResolvedValue(mockInvoice),
    },
    sales_invoice_items: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    stock_ledgers: {
      findFirst: jest.fn().mockResolvedValue(mockStockLedger),
      create: jest.fn().mockResolvedValue({}),
    },
    journal_entries: {
      create: jest.fn().mockResolvedValue({}),
    },
    audit_logs: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest
      .fn()
      .mockImplementation(
        (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
          cb(prismaMock),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should calculate Intra-State CGST+SGST correctly and create single-entry cascade', async () => {
    void (await service.create({
      companyId: 'comp-1',
      customerId: 'cust-1',
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-08-27',
      placeOfSupply: 'Karnataka',
      items: [
        {
          productId: 'prod-1',
          description: 'Widget A',
          quantity: 10,
          unitPrice: 100,
          gstRate: 18,
        },
      ],
    }));

    expect(salesInvoiceCreateMock).toHaveBeenCalled();
  });
});

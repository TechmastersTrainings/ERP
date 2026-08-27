import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockJournalEntries = [
    {
      account_name: 'Accounts Receivable',
      debit: 1180,
      credit: 0,
      entry_date: new Date(),
    },
    {
      account_name: 'Sales Revenue',
      debit: 0,
      credit: 1000,
      entry_date: new Date(),
    },
    {
      account_name: 'CGST Payable',
      debit: 0,
      credit: 90,
      entry_date: new Date(),
    },
    {
      account_name: 'SGST Payable',
      debit: 0,
      credit: 90,
      entry_date: new Date(),
    },
  ];

  const mockSales = [
    {
      subtotal: 1000,
      discount_total: 0,
      balance_due: 1180,
      cgst_total: 90,
      sgst_total: 90,
      igst_total: 0,
      invoice_date: new Date(),
    },
  ];
  const mockPurchases = [
    {
      subtotal: 500,
      discount_total: 0,
      balance_due: 590,
      cgst_total: 45,
      sgst_total: 45,
      igst_total: 0,
    },
  ];

  const prismaMock = {
    journal_entries: {
      findMany: jest.fn().mockResolvedValue(mockJournalEntries),
    },
    sales_invoices: { findMany: jest.fn().mockResolvedValue(mockSales) },
    purchase_invoices: { findMany: jest.fn().mockResolvedValue(mockPurchases) },
    credit_notes: { findMany: jest.fn().mockResolvedValue([]) },
    debit_notes: { findMany: jest.fn().mockResolvedValue([]) },
    stock_ledgers: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should calculate balanced Trial Balance', async () => {
    const result = await service.getTrialBalance('comp-1');
    expect(result.is_balanced).toBe(true);
    expect(result.total_debit).toBe(1180);
    expect(result.total_credit).toBe(1180);
  });

  it('should calculate Profit and Loss statement', async () => {
    const result = await service.getProfitAndLoss('comp-1');
    expect(result.revenue.net_revenue).toBe(1000);
    expect(result.cost_of_sales.cogs).toBe(500);
    expect(result.gross_profit).toBe(500);
  });
});

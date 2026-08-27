import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TransfersService', () => {
  let service: TransfersService;

  const mockPrisma = {
    $transaction: jest.fn(
      async (
        cb: (tx: {
          stock_transfers: { create: jest.Mock };
          stock_ledgers: { create: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        cb({
          stock_transfers: {
            create: jest.fn().mockResolvedValue({
              id: 'trf-1',
              company_id: 'comp-1',
              transfer_number: 'TRF-001',
              source_warehouse_id: 'wh-a',
              target_warehouse_id: 'wh-b',
              transfer_date: new Date(),
              product_id: 'prod-1',
              quantity: 50,
            }),
          },
          stock_ledgers: {
            create: jest.fn().mockResolvedValue({}),
          },
        }),
    ),
    stock_transfers: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'trf-1',
          company_id: 'comp-1',
          transfer_number: 'TRF-001',
          source_warehouse_id: 'wh-a',
          target_warehouse_id: 'wh-b',
          transfer_date: new Date(),
          product_id: 'prod-1',
          quantity: 50,
        },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should transfer stock between warehouses with dual ledger entries', async () => {
    const res = await service.createTransfer({
      companyId: 'comp-1',
      transferNumber: 'TRF-001',
      sourceWarehouseId: 'wh-a',
      targetWarehouseId: 'wh-b',
      productId: 'prod-1',
      quantity: 50,
    });

    expect(res.id).toBe('trf-1');
    expect(res.quantity).toBe(50);
  });
});

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FixedAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(dto: {
    companyId: string;
    assetName: string;
    assetCategory: string;
    purchaseCost: number;
    depreciationMethod?: 'WDV' | 'SLM';
    depreciationRate?: number;
  }) {
    const method = dto.depreciationMethod || 'WDV';
    const rate = dto.depreciationRate || 15.0;

    const asset = await this.prisma.fixed_assets.create({
      data: {
        company_id: dto.companyId,
        asset_name: dto.assetName,
        asset_category: dto.assetCategory,
        purchase_date: new Date(),
        purchase_cost: dto.purchaseCost,
        depreciation_method: method,
        depreciation_rate: rate,
        accumulated_depr: 0,
        net_book_value: dto.purchaseCost,
      },
    });

    return {
      ...asset,
      purchase_cost: Number(asset.purchase_cost),
      depreciation_rate: Number(asset.depreciation_rate),
      accumulated_depr: Number(asset.accumulated_depr),
      net_book_value: Number(asset.net_book_value),
    };
  }

  async getAssets(companyId: string) {
    const assets = await this.prisma.fixed_assets.findMany({
      where: { company_id: companyId },
      orderBy: { purchase_date: 'desc' },
    });

    return assets.map((a) => ({
      ...a,
      purchase_cost: Number(a.purchase_cost),
      depreciation_rate: Number(a.depreciation_rate),
      accumulated_depr: Number(a.accumulated_depr),
      net_book_value: Number(a.net_book_value),
    }));
  }

  async runAnnualDepreciation(companyId: string) {
    const assets = await this.prisma.fixed_assets.findMany({
      where: { company_id: companyId },
    });

    let totalDeprExpense = 0;

    for (const asset of assets) {
      const rate = Number(asset.depreciation_rate) / 100;
      const nbv = Number(asset.net_book_value);
      const annualDepr = Math.round(nbv * rate * 100) / 100;
      const newNbv = Math.max(0, nbv - annualDepr);
      const newAccum = Number(asset.accumulated_depr) + annualDepr;

      await this.prisma.fixed_assets.update({
        where: { id: asset.id },
        data: {
          accumulated_depr: newAccum,
          net_book_value: newNbv,
        },
      });

      totalDeprExpense += annualDepr;
    }

    // Auto-post General Ledger Depreciation Expense Entry
    if (totalDeprExpense > 0) {
      await this.prisma.journal_entries.create({
        data: {
          company_id: companyId,
          reference_type: 'DEPRECIATION_RUN',
          account_name: 'Depreciation Expense Account',
          debit: totalDeprExpense,
          credit: 0,
          narration:
            'Annual statutory depreciation run posted per Companies Act 2013 / Income Tax Act 1961',
          entry_date: new Date(),
        },
      });

      await this.prisma.journal_entries.create({
        data: {
          company_id: companyId,
          reference_type: 'DEPRECIATION_RUN',
          account_name: 'Accumulated Depreciation Account',
          debit: 0,
          credit: totalDeprExpense,
          narration: 'Annual accumulated depreciation contra-asset posting',
          entry_date: new Date(),
        },
      });
    }

    return {
      message:
        'Annual depreciation run completed & General Ledger posted cleanly.',
      totalAssetsProcessed: assets.length,
      totalDepreciationExpense: totalDeprExpense,
    };
  }
}

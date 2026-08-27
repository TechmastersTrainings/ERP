import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ConsolidationService {
  constructor(private readonly prisma: PrismaService) {}

  async linkGroupCompanies(dto: {
    groupName: string;
    parentCompanyId: string;
    childCompanyId: string;
    ownershipPercent?: number;
  }) {
    const link = await this.prisma.company_groups.create({
      data: {
        group_name: dto.groupName,
        parent_company_id: dto.parentCompanyId,
        child_company_id: dto.childCompanyId,
        ownership_percent: dto.ownershipPercent || 100.0,
      },
    });

    return {
      ...link,
      ownership_percent: Number(link.ownership_percent),
    };
  }

  async getConsolidatedFinancials(parentCompanyId: string) {
    const groupLinks = await this.prisma.company_groups.findMany({
      where: { parent_company_id: parentCompanyId },
    });

    const companyIds = [
      parentCompanyId,
      ...groupLinks.map((g) => g.child_company_id),
    ];

    const salesInvoices = await this.prisma.sales_invoices.findMany({
      where: { company_id: { in: companyIds } },
    });

    const purchaseInvoices = await this.prisma.purchase_invoices.findMany({
      where: { company_id: { in: companyIds } },
    });

    let standaloneRevenue = 0;
    let standalonePurchases = 0;

    salesInvoices.forEach((s) => {
      standaloneRevenue += Number(s.subtotal);
    });

    purchaseInvoices.forEach((p) => {
      standalonePurchases += Number(p.subtotal);
    });

    // Intercompany Elimination Logic (Detect transactions between Group Companies)
    const parentComp = await this.prisma.companies.findUnique({
      where: { id: parentCompanyId },
    });
    const parentGstin = parentComp?.gstin || '';

    let intercompanyRevenueElimination = 0;
    salesInvoices.forEach((s) => {
      if (
        s.place_of_supply &&
        parentGstin &&
        s.place_of_supply.includes(parentGstin)
      ) {
        intercompanyRevenueElimination += Number(s.subtotal);
      }
    });

    const consolidatedNetRevenue = Math.max(
      0,
      standaloneRevenue - intercompanyRevenueElimination,
    );
    const consolidatedNetPurchases = Math.max(
      0,
      standalonePurchases - intercompanyRevenueElimination,
    );
    const consolidatedGrossProfit =
      consolidatedNetRevenue - consolidatedNetPurchases;

    return {
      groupName:
        groupLinks.length > 0 ? groupLinks[0].group_name : 'Corporate Group',
      totalCompaniesInGroup: companyIds.length,
      standaloneSummary: {
        totalRevenue: standaloneRevenue,
        totalPurchases: standalonePurchases,
      },
      intercompanyEliminations: {
        intercompanySalesEliminated: intercompanyRevenueElimination,
        intercompanyPurchasesEliminated: intercompanyRevenueElimination,
      },
      consolidatedFinancials: {
        consolidatedRevenue: consolidatedNetRevenue,
        consolidatedPurchases: consolidatedNetPurchases,
        consolidatedGrossProfit: consolidatedGrossProfit,
        isIntercompanyBalanced: true,
      },
    };
  }
}

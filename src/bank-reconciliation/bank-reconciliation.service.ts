import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BankReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadBankStatementLine(dto: {
    companyId: string;
    transactionDate: string;
    referenceNumber: string;
    description: string;
    amount: number;
    transactionType: 'CREDIT' | 'DEBIT';
  }) {
    const stmt = await this.prisma.bank_statements.create({
      data: {
        company_id: dto.companyId,
        transaction_date: new Date(dto.transactionDate),
        reference_number: dto.referenceNumber,
        description: dto.description,
        amount: dto.amount,
        transaction_type: dto.transactionType,
        match_status: 'UNRECONCILED',
      },
    });

    return {
      ...stmt,
      amount: Number(stmt.amount),
    };
  }

  async runAutoReconciliation(companyId: string) {
    const unrecStatements = await this.prisma.bank_statements.findMany({
      where: { company_id: companyId, match_status: 'UNRECONCILED' },
    });

    const internalPayments = await this.prisma.payment_records.findMany({
      where: { company_id: companyId },
    });

    for (const stmt of unrecStatements) {
      const stmtAmount = Number(stmt.amount);
      const match = internalPayments.find(
        (p) =>
          Number(p.amount) === stmtAmount ||
          (p.reference_number && p.reference_number === stmt.reference_number),
      );

      if (match) {
        await this.prisma.bank_statements.update({
          where: { id: stmt.id },
          data: { match_status: 'MATCHED' },
        });
      }
    }

    return this.getBrsSummary(companyId);
  }

  async getBrsSummary(companyId: string) {
    const statements = await this.prisma.bank_statements.findMany({
      where: { company_id: companyId },
    });

    const internalPayments = await this.prisma.payment_records.findMany({
      where: { company_id: companyId },
    });

    let bankCredits = 0;
    let bankDebits = 0;
    let matchedCount = 0;
    let unreconciledCount = 0;

    statements.forEach((s) => {
      const amt = Number(s.amount);
      if (s.transaction_type === 'CREDIT') bankCredits += amt;
      else bankDebits += amt;

      if (s.match_status === 'MATCHED') matchedCount++;
      else unreconciledCount++;
    });

    const bankBalance = bankCredits - bankDebits;

    let cashbookReceipts = 0;
    let cashbookPayments = 0;

    internalPayments.forEach((p) => {
      const amt = Number(p.amount);
      if (p.payment_type === 'RECEIPT') cashbookReceipts += amt;
      else cashbookPayments += amt;
    });

    const cashbookBalance = cashbookReceipts - cashbookPayments;
    const variance = Math.abs(bankBalance - cashbookBalance);

    return {
      bankStatementBalance: bankBalance,
      internalCashbookBalance: cashbookBalance,
      unreconciledVariance: variance,
      statementSummary: {
        totalStatements: statements.length,
        matchedCount,
        unreconciledCount,
        reconciliationRatePercent:
          statements.length > 0
            ? Math.round((matchedCount / statements.length) * 100)
            : 100,
      },
    };
  }
}

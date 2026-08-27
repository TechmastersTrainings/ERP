import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async createEmployee(dto: {
    companyId: string;
    empCode: string;
    fullName: string;
    designation: string;
    department: string;
    basicSalary: number;
    hraAllowance?: number;
    specialAllowance?: number;
    pan?: string;
    pfNumber?: string;
    esiNumber?: string;
  }) {
    const emp = await this.prisma.employees.create({
      data: {
        company_id: dto.companyId,
        emp_code: dto.empCode,
        full_name: dto.fullName,
        designation: dto.designation,
        department: dto.department,
        basic_salary: dto.basicSalary,
        hra_allowance: dto.hraAllowance || 0,
        special_allowance: dto.specialAllowance || 0,
        pan: dto.pan,
        pf_number: dto.pfNumber,
        esi_number: dto.esiNumber,
      },
    });

    return {
      ...emp,
      basic_salary: Number(emp.basic_salary),
      hra_allowance: Number(emp.hra_allowance),
      special_allowance: Number(emp.special_allowance),
    };
  }

  async getEmployees(companyId: string) {
    const emps = await this.prisma.employees.findMany({
      where: { company_id: companyId },
    });

    return emps.map((e) => ({
      ...e,
      basic_salary: Number(e.basic_salary),
      hra_allowance: Number(e.hra_allowance),
      special_allowance: Number(e.special_allowance),
    }));
  }

  async processMonthlyPayroll(dto: { companyId: string; payPeriod: string }) {
    const employees = await this.prisma.employees.findMany({
      where: { company_id: dto.companyId },
    });

    let totalGross = 0;
    let totalPf = 0;
    let totalEsi = 0;
    let totalPt = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const basic = Number(emp.basic_salary);
      const hra = Number(emp.hra_allowance);
      const special = Number(emp.special_allowance);
      const gross = basic + hra + special;

      // Statutory Statutory Deductions Calculation (India HR Rules)
      const pfDeduction = Math.min(1800, Math.round(basic * 0.12));
      const esiDeduction = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const ptDeduction = gross >= 15000 ? 200 : 0; // Standard Professional Tax
      const netPay = gross - (pfDeduction + esiDeduction + ptDeduction);

      totalGross += gross;
      totalPf += pfDeduction;
      totalEsi += esiDeduction;
      totalPt += ptDeduction;
      totalNet += netPay;
    }

    const payrollRun = await this.prisma.payroll_runs.create({
      data: {
        company_id: dto.companyId,
        pay_period: dto.payPeriod,
        total_gross_pay: totalGross,
        total_pf_deduction: totalPf,
        total_esi_deduction: totalEsi,
        total_pt_deduction: totalPt,
        total_net_pay: totalNet,
        status: 'PROCESSED',
      },
    });

    // Auto-post General Ledger Journal Entries for Salary Expenses & Statutory Liabilities
    if (totalGross > 0) {
      await this.prisma.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PAYROLL_RUN',
          reference_id: payrollRun.id,
          account_name: 'Salaries & Wages Expense Account',
          debit: totalGross,
          credit: 0,
          narration: `Monthly Gross Payroll Expense for period ${dto.payPeriod}`,
          entry_date: new Date(),
        },
      });

      await this.prisma.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PAYROLL_RUN',
          reference_id: payrollRun.id,
          account_name: 'Provident Fund (PF) Payable Account',
          debit: 0,
          credit: totalPf,
          narration: `Provident Fund statutory deduction for period ${dto.payPeriod}`,
          entry_date: new Date(),
        },
      });

      await this.prisma.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PAYROLL_RUN',
          reference_id: payrollRun.id,
          account_name: 'ESI & Professional Tax Payable Account',
          debit: 0,
          credit: totalEsi + totalPt,
          narration: `ESI & PT statutory deduction for period ${dto.payPeriod}`,
          entry_date: new Date(),
        },
      });

      await this.prisma.journal_entries.create({
        data: {
          company_id: dto.companyId,
          reference_type: 'PAYROLL_RUN',
          reference_id: payrollRun.id,
          account_name: 'Net Salary Payable Account',
          debit: 0,
          credit: totalNet,
          narration: `Net Salary Payable to employees for period ${dto.payPeriod}`,
          entry_date: new Date(),
        },
      });
    }

    return {
      payrollRunId: payrollRun.id,
      payPeriod: dto.payPeriod,
      totalEmployees: employees.length,
      summary: {
        totalGrossPay: totalGross,
        totalPfDeduction: totalPf,
        totalEsiDeduction: totalEsi,
        totalPtDeduction: totalPt,
        totalNetSalaryPayable: totalNet,
      },
    };
  }

  async getPayrollRuns(companyId: string) {
    const runs = await this.prisma.payroll_runs.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });

    return runs.map((r) => ({
      ...r,
      total_gross_pay: Number(r.total_gross_pay),
      total_pf_deduction: Number(r.total_pf_deduction),
      total_esi_deduction: Number(r.total_esi_deduction),
      total_pt_deduction: Number(r.total_pt_deduction),
      total_net_pay: Number(r.total_net_pay),
    }));
  }
}

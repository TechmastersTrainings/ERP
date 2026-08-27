import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service.js';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('employees')
  async createEmployee(
    @Body()
    body: {
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
    },
  ) {
    return this.payrollService.createEmployee(body);
  }

  @Get('employees')
  async getEmployees(@Query('companyId') companyId: string) {
    return this.payrollService.getEmployees(companyId || '');
  }

  @Post('run')
  async processMonthlyPayroll(
    @Body() body: { companyId: string; payPeriod: string },
  ) {
    return this.payrollService.processMonthlyPayroll(body);
  }

  @Get('runs')
  async getPayrollRuns(@Query('companyId') companyId: string) {
    return this.payrollService.getPayrollRuns(companyId || '');
  }
}

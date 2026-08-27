import { Controller, Get, Post, Body, Query, Header } from '@nestjs/common';
import {
  ImportExportService,
  BulkImportCustomerDto,
} from './import-export.service';

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get('export/sales')
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    'attachment; filename="sales_invoices_export.csv"',
  )
  exportSales(@Query('companyId') companyId: string) {
    return this.importExportService.exportSalesInvoicesCsv(companyId);
  }

  @Get('export/customers')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="customers_export.csv"')
  exportCustomers(@Query('companyId') companyId: string) {
    return this.importExportService.exportCustomersCsv(companyId);
  }

  @Post('import/customers')
  importCustomers(@Body() dto: BulkImportCustomerDto) {
    return this.importExportService.importCustomersBulk(dto);
  }
}

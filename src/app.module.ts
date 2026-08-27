import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductModule } from './product/product.module.js';
import { CustomerModule } from './customer/customer.module.js';
import { SupplierModule } from './supplier/supplier.module.js';
import { SalesModule } from './sales/sales.module.js';
import { PurchasesModule } from './purchases/purchases.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { GstModule } from './gst/gst.module.js';
import { AuditModule } from './audit/audit.module.js';
import { TransfersModule } from './transfers/transfers.module.js';
import { CreditNotesModule } from './credit-notes/credit-notes.module.js';
import { DebitNotesModule } from './debit-notes/debit-notes.module.js';
import { EinvoiceModule } from './einvoice/einvoice.module.js';
import { EwaybillModule } from './ewaybill/ewaybill.module.js';
import { ReconciliationModule } from './reconciliation/reconciliation.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { ImportExportModule } from './import-export/import-export.module.js';
import { ForexModule } from './forex/forex.module.js';
import { BatchesModule } from './batches/batches.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AdminModule } from './admin/admin.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { RemindersModule } from './reminders/reminders.module.js';
import { JobWorkModule } from './job-work/job-work.module.js';
import { TdsTcsModule } from './tds-tcs/tds-tcs.module.js';
import { Gstr9Module } from './gstr9/gstr9.module.js';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module.js';
import { PayrollModule } from './payroll/payroll.module.js';
import { ConsolidationModule } from './consolidation/consolidation.module.js';
import { BankReconciliationModule } from './bank-reconciliation/bank-reconciliation.module.js';
import { ProductionModule } from './production/production.module.js';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api*'],
    }),
    AuthModule,
    ProductModule,
    CustomerModule,
    SupplierModule,
    SalesModule,
    PurchasesModule,
    InventoryModule,
    PaymentsModule,
    GstModule,
    AuditModule,
    TransfersModule,
    CreditNotesModule,
    DebitNotesModule,
    EinvoiceModule,
    EwaybillModule,
    ReconciliationModule,
    ReportsModule,
    SubscriptionsModule,
    ImportExportModule,
    ForexModule,
    BatchesModule,
    AnalyticsModule,
    AdminModule,
    OrdersModule,
    RemindersModule,
    JobWorkModule,
    TdsTcsModule,
    Gstr9Module,
    FixedAssetsModule,
    PayrollModule,
    ConsolidationModule,
    BankReconciliationModule,
    ProductionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

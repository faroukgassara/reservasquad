import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { AuditModule } from '../audit/audit.module';
import { DailyIncomeModule } from '../dailyIncome/daily-income.module';
import { PosCatalogController } from './pos-catalog.controller';
import { PosCatalogService } from './pos-catalog.service';
import { PosSessionController } from './pos-session.controller';
import { PosSessionService } from './pos-session.service';
import { PosOrderController } from './pos-order.controller';
import { PosOrderService } from './pos-order.service';
import { PosSaleOrderController } from './pos-sale-order.controller';
import { PosSaleOrderService } from './pos-sale-order.service';
import { PosInvoiceController } from './pos-invoice.controller';
import { PosInvoiceService } from './pos-invoice.service';
import { PosReportController } from './pos-report.controller';
import { PosReportService } from './pos-report.service';
import { PosSubscriptionController } from './pos-subscription.controller';
import { PosSubscriptionCardController } from './pos-subscription-card.controller';
import { PosSubscriptionService } from './pos-subscription.service';

@Module({
  imports: [PrismaModule, AuditModule, DailyIncomeModule],
  controllers: [
    PosCatalogController,
    PosSessionController,
    PosOrderController,
    PosSaleOrderController,
    PosInvoiceController,
    PosReportController,
    PosSubscriptionController,
    PosSubscriptionCardController,
  ],
  providers: [
    PosCatalogService,
    PosSessionService,
    PosOrderService,
    PosSaleOrderService,
    PosInvoiceService,
    PosReportService,
    PosSubscriptionService,
    FileUploadService,
  ],
})
export class PosModule {}

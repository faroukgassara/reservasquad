import { Module } from '@nestjs/common';
import { DailyIncomeService } from './daily-income.service';
import { DailyIncomeBackofficeController } from './daily-income-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DailyIncomeBackofficeController],
  providers: [DailyIncomeService],
  exports: [DailyIncomeService],
})
export class DailyIncomeModule {}

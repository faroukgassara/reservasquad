import { Module } from '@nestjs/common';
import { DailyIncomeService } from './daily-income.service';
import { DailyIncomeBackofficeController } from './daily-income-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DailyIncomeBackofficeController],
  providers: [DailyIncomeService],
  exports: [DailyIncomeService],
})
export class DailyIncomeModule {}

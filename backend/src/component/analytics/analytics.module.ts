import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductAnalyticsController } from './product-analytics.controller';
import { ProductAnalyticsService } from './product-analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductAnalyticsController],
  providers: [ProductAnalyticsService],
  exports: [ProductAnalyticsService],
})
export class AnalyticsModule {}

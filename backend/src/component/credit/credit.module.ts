import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditBackofficeController } from './credit-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CreditBackofficeController],
  providers: [CreditService],
})
export class CreditModule {}

import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditBackofficeController } from './audit-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditBackofficeController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

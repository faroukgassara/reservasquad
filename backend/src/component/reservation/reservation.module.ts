import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationBackofficeController } from './reservation-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReservationBackofficeController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}

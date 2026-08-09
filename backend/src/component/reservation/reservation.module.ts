import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationBackofficeController } from './reservation-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationBackofficeController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}

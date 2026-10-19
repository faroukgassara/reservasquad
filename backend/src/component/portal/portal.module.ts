import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProfessorModule } from '../professor/professor.module';
import { ReservationModule } from '../reservation/reservation.module';
import { NotificationModule } from '../notification/notification.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [PrismaModule, ProfessorModule, ReservationModule, NotificationModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}

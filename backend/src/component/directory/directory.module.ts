import { Module } from '@nestjs/common';
import { TeachersAdminController } from './teachers-admin.controller';
import { BookingPublicController } from './booking-public.controller';
import { TeachersService } from './teachers.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeachersAdminController, BookingPublicController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class DirectoryModule {}

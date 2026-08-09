import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomBackofficeController } from './room-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadService } from 'src/common/common-services/file-upload.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoomBackofficeController],
  providers: [RoomService, FileUploadService],
  exports: [RoomService],
})
export class RoomModule {}

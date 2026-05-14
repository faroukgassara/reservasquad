import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DirectoryController],
})
export class DirectoryModule {}

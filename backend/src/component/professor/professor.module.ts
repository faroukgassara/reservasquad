import { Module } from '@nestjs/common';
import { ProfessorService } from './professor.service';
import { ProfessorBackofficeController } from './professor-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessorBackofficeController],
  providers: [ProfessorService],
  exports: [ProfessorService],
})
export class ProfessorModule {}

import { Module } from '@nestjs/common';
import { ProfessorService } from './professor.service';
import { ProfessorBackofficeController } from './professor-backoffice.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfessorBackofficeController],
  providers: [ProfessorService],
  exports: [ProfessorService],
})
export class ProfessorModule {}

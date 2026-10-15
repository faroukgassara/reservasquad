import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from 'src/common/email/email.module';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterBackofficeController } from './newsletter-backoffice.controller';
import { NewsletterPublicController } from './newsletter-public.controller';
import { NewsletterResumeCronService } from './newsletter-resume.cron';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  controllers: [NewsletterBackofficeController, NewsletterPublicController],
  providers: [
    NewsletterService,
    NewsletterResumeCronService,
    FileUploadService,
  ],
  exports: [NewsletterService],
})
export class NewsletterModule {}

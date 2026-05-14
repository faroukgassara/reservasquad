import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { FileUploadService } from 'src/common/common-services/file-upload.service';

import { EmailService } from 'src/common/email/email.service';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { JwtService } from '@nestjs/jwt';


@Module({
        imports: [ScheduleModule.forRoot(), HttpModule, PrismaModule, UserModule],
        controllers: [CronController],
        providers: [
                CronService,
                UserService,
                FileUploadService,
                EmailService,
                CommonFunctionService,
                JwtService,
        ],
})
export class CronModule { }

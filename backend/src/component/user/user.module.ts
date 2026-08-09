import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserBackofficeController } from './user-backoffice.controller';
import { UserService } from './user.service';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { CommonFunctionService } from 'src/common/common-services/common-function';


@Module({
    controllers: [UserController, UserBackofficeController],
    providers: [
        UserService,
        FileUploadService,
        EmailService,
        JwtService,
        CommonFunctionService,
    ]
})
export class UserModule { }


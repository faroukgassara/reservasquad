import { Module } from '@nestjs/common';
import { FileUploadService } from '../../common/common-services/file-upload.service';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { CommonFunctionService } from './common-function';

@Module({
  imports: [HttpModule],
  providers: [FileUploadService, JwtService, CommonFunctionService],
  exports: [FileUploadService, JwtService, CommonFunctionService],
})
export class CommonServicesModule { }

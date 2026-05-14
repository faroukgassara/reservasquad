import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { CommonFunctionService } from 'src/common/common-services/common-function';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PassportModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    FileUploadService,
    EmailService,
    CommonFunctionService,
  ]

})
export class AuthModule { }

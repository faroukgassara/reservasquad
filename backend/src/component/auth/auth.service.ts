import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { IEnv } from 'src/common/env/env';
import { AuthResponseDto } from 'src/dto/login/authResponse.dto';
import { AuthUserPayloadDto } from 'src/dto/login/authUserPayload.dto';
import { LoginDTO } from 'src/dto/login/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeEmail } from 'src/common/utils/email.util';
import { RegisterDto } from 'src/dto/auth/register.dto';

@Injectable()
export class AuthService {
  readonly config: IEnv
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly commonFunction: CommonFunctionService,

  ) {
    this.config = this.configService.get<IEnv>('env');
  }

  private async findActiveResetToken(token: string) {
    const tokenHash = this.commonFunction.hashResetPasswordToken(token);

    return this.prismaService.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = normalizeEmail(dto.email);
    const exists = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (exists) throw new ConflictException('Email already in use.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prismaService.user.create({
      data: {
        name: dto.name,
        email,
        password: passwordHash,
        role: Role.TEACHER,
      },
    });

    const { password, ...safeUser } = created;
    return {
      ...safeUser,
      ...this.commonFunction.generateToken({ ...created }, true),
    } as AuthResponseDto;
  }

  async login(dto: LoginDTO): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findFirst({
      where: { email: normalizeEmail(dto.email) },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...safeUser } = user;

    return {
      ...safeUser,
      ...this.commonFunction.generateToken({ ...user }, dto.rememberMe ?? false),
    };
  }

  // async refreshTokens(payload: { id: string }): Promise<any> {
  //   const user = await this.prismaService.user.findUnique({
  //     where: { id: payload.id }
  //   });
  //   const { password, ...safeUser } = user;
  //   const tokens = this.commonFunction.generateToken({ ...user });
  //   return {
  //     ...safeUser,
  //     ...tokens,
  //   };
  // }

  async refreshTokens(payload: AuthUserPayloadDto): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const currentTokenVersion = user.tokenVersion ?? 0;
    if ((payload.tokenVersion ?? 0) !== currentTokenVersion) {
      throw new ForbiddenException('Refresh token invalidated');
    }

    const tokens = this.commonFunction.generateToken(user, payload.rememberMe ?? true);

    const { password, ...safeUser } = user;

    return {
      ...safeUser,
      ...tokens,
    };
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
  }

  async logout(payload: AuthUserPayloadDto): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const currentTokenVersion = user.tokenVersion ?? 0;
    if ((payload.tokenVersion ?? 0) !== currentTokenVersion) {
      return;
    }

    await this.prismaService.user.update({
      where: { id: payload.id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }

  async generateResetToken(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.prismaService.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      return null;
    }

    const resetToken = this.commonFunction.generateResetPasswordToken(user, randomUUID());

    await this.prismaService.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.commonFunction.hashResetPasswordToken(resetToken),
        },
      });
    });

    const resetPasswordClientTemplate = await this.fileUploadService.renderTemplate(
      {
        link:
          this.config.FRONT_URL +
          '/reset-password/' +
          resetToken,
        apiUrl: this.config.HOST + ':' + this.config.PORT,
        frontUrl: this.config.FRONT_URL
      },
      'resetPasswordClient.ejs',
    );
    if (resetToken) {
      this.emailService.sendMail({
        to: normalizedEmail,
        from: this.config.SMTP_SEND,
        subject: 'Demande de réinitialisation de mot de passe',
        template: resetPasswordClientTemplate,
        attachments: [],
      });
    }
    return user;
  }

  async validateResetToken(token: string): Promise<User | null> {
    const payload = this.commonFunction.verifyResetPasswordToken(token);
    if (!payload?.sub || !payload?.email) {
      return null;
    }

    const activeToken = await this.findActiveResetToken(token);

    if (!activeToken || activeToken.userId !== payload.sub || activeToken.user?.email !== payload.email) {
      return null;
    }

    return activeToken.user;
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<User | null> {
    const payload = this.commonFunction.verifyResetPasswordToken(token);
    if (!payload?.sub || !payload?.email) {
      return null;
    }

    const activeToken = await this.findActiveResetToken(token);

    if (!activeToken || activeToken.userId !== payload.sub || activeToken.user?.email !== payload.email) {
      return null;
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await this.prismaService.$transaction(async (tx) => {
      const consumedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: activeToken.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      if (consumedToken.count !== 1) {
        return null;
      }

      await tx.passwordResetToken.updateMany({
        where: {
          userId: activeToken.userId,
          id: { not: activeToken.id },
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return tx.user.update({
        where: { id: activeToken.userId },
        data: {
          password: passwordHash,
        },
      });
    });

    return result;
  }


}

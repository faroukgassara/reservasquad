import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, EStatus, ERole } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { IEnv } from 'src/common/env/env';
import { AuthResponseDto } from 'src/dto/login/authResponse.dto';
import { AuthUserPayloadDto } from 'src/dto/login/authUserPayload.dto';
import { LoginDTO } from 'src/dto/login/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeEmail } from 'src/common/utils/email.util';

const PROFESSOR_INVITE_VALID_DAYS = 7;

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

  async login(dto: LoginDTO): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findFirst({
      where: { email: normalizeEmail(dto.email), deletedAt: null },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== EStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    const { password, ...safeUser } = user;

    return {
      ...safeUser,
      ...this.commonFunction.generateToken({ ...user }),
    };
  }

  async refreshTokens(payload: AuthUserPayloadDto): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || user.deletedAt || user.status !== EStatus.ACTIVE) {
      throw new ForbiddenException('Access Denied');
    }

    const currentTokenVersion = user.tokenVersion ?? 0;
    if ((payload.tokenVersion ?? 0) !== currentTokenVersion) {
      throw new ForbiddenException('Refresh token invalidated');
    }

    const tokens = this.commonFunction.generateToken(user);

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
        attachments: [this.emailService.getBiblioSquadLogoAttachment()],
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

  private async findActiveActivationToken(token: string) {
    const tokenHash = this.commonFunction.hashResetPasswordToken(token);

    return this.prismaService.emailActivationToken.findFirst({
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

  private async sendActivationEmail(user: User, activationToken: string): Promise<void> {
    const frontUrl = this.config.FRONT_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const html = await this.fileUploadService.renderTemplate(
      {
        link: `${frontUrl}/activate/${activationToken}`,
        firstName: user.firstName,
        frontUrl,
      },
      'activateAccountClient.ejs',
    );

    await this.emailService.sendMail({
      to: user.email,
      from: this.config.SMTP_SEND,
      subject: 'Activate your Biblio Squad account',
      template: html,
      attachments: [this.emailService.getBiblioSquadLogoAttachment()],
    });
  }

  private async issueActivationToken(user: User, expiresIn?: string): Promise<string> {
    const activationToken = this.commonFunction.generateResetPasswordToken(user, randomUUID(), expiresIn);

    await this.prismaService.$transaction(async (tx) => {
      await tx.emailActivationToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.emailActivationToken.create({
        data: {
          userId: user.id,
          tokenHash: this.commonFunction.hashResetPasswordToken(activationToken),
        },
      });
    });

    return activationToken;
  }

  async inviteProfessor(professorId: string): Promise<{ email: string; resent: boolean }> {
    const professor = await this.prismaService.professor.findFirst({
      where: { id: professorId, deletedAt: null },
      include: { user: true },
    });
    if (!professor) throw new NotFoundException('Professor not found');
    if (!professor.email) {
      throw new BadRequestException('This professor has no email address');
    }

    const email = normalizeEmail(professor.email);
    let user = professor.user;
    const resent = Boolean(user);

    if (user) {
      if (user.status === EStatus.ACTIVE) {
        throw new ConflictException('This professor already has portal access');
      }
    } else {
      const emailOwner = await this.prismaService.user.findUnique({ where: { email } });
      if (emailOwner) {
        throw new ConflictException('This email is already used by another account');
      }
      const phone = professor.phone?.replaceAll(/\s+/g, '') || null;
      const phoneTaken = phone
        ? await this.prismaService.user.findUnique({ where: { phone } })
        : null;

      user = await this.prismaService.user.create({
        data: {
          firstName: professor.firstName,
          lastName: professor.lastName,
          email,
          phone: phoneTaken ? null : phone,
          // Unusable until the professor sets a password through the invitation link.
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
          status: EStatus.INACTIVE,
          imageUrl: '',
          role: ERole.PROFESSOR,
          professorId: professor.id,
        },
      });
    }

    const activationToken = await this.issueActivationToken(user, `${PROFESSOR_INVITE_VALID_DAYS}d`);
    const frontUrl = this.config.FRONT_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const html = await this.fileUploadService.renderTemplate(
      {
        link: `${frontUrl}/fr/activate/${activationToken}`,
        firstName: user.firstName,
        email: user.email,
        validDays: PROFESSOR_INVITE_VALID_DAYS,
      },
      'professorInvitation.ejs',
    );

    const sent = await this.emailService.sendMail({
      to: user.email,
      from: this.config.SMTP_SEND,
      subject: 'Votre accès au portail professeur Biblio Squad',
      template: html,
      attachments: [this.emailService.getBiblioSquadLogoAttachment()],
    });
    if (!sent) {
      throw new BadRequestException('The invitation email could not be sent');
    }

    return { email: user.email, resent };
  }

  async activateAccount(token: string, password?: string): Promise<{ email: string }> {
    const payload = this.commonFunction.verifyResetPasswordToken(token);
    if (!payload?.sub || !payload?.email) {
      throw new BadRequestException('Invalid or expired activation link');
    }

    const activeToken = await this.findActiveActivationToken(token);
    if (!activeToken || activeToken.userId !== payload.sub || activeToken.user?.email !== payload.email) {
      throw new BadRequestException('Invalid or expired activation link');
    }

    if (activeToken.user.status === EStatus.ACTIVE) {
      return { email: activeToken.user.email };
    }

    if (activeToken.user.role === ERole.PROFESSOR && !password) {
      throw new BadRequestException('A password is required to activate this account');
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    const now = new Date();

    const result = await this.prismaService.$transaction(async (tx) => {
      const consumed = await tx.emailActivationToken.updateMany({
        where: {
          id: activeToken.id,
          usedAt: null,
          revokedAt: null,
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        return null;
      }

      await tx.emailActivationToken.updateMany({
        where: {
          userId: activeToken.userId,
          id: { not: activeToken.id },
          usedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });

      return tx.user.update({
        where: { id: activeToken.userId },
        data: {
          status: EStatus.ACTIVE,
          ...(passwordHash && { password: passwordHash }),
        },
      });
    });

    if (!result) {
      throw new BadRequestException('Invalid or expired activation link');
    }

    return { email: result.email };
  }
}

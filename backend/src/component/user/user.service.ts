import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/dto/user/createUser.dto';
import { UpdateUserDto } from 'src/dto/user/updateUser.dto';
import * as bcrypt from 'bcrypt';
import { ERole, EStatus, Prisma, User } from 'src/generated/prisma/client';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { IEnv } from 'src/common/env/env';
import { FetchUsersDto } from 'src/dto/user/fetchUsers.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { normalizeEmail } from 'src/common/utils/email.util';

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  readonly config: IEnv;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly commonFunction: CommonFunctionService,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<IEnv>('env');
  }

  async createUser(user: CreateUserDto, inviterName = 'Biblio Squad'): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const email = normalizeEmail(user.email);
    const status =
      user.role === ERole.ADMIN
        ? EStatus.ACTIVE
        : (user.status ?? EStatus.ACTIVE);

    const createdUser = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        status,
        imageUrl: user.imageUrl ?? 'http://example.com/image.jpg',
        phone: user.phone.replaceAll(/\s+/g, ''),
        role: user.role,
      },
    });

    await this.sendInvitationEmail({
      email: createdUser.email,
      temporaryPassword: user.password,
      inviterName,
    });

    return createdUser;
  }

  private async sendInvitationEmail(params: {
    email: string;
    temporaryPassword: string;
    inviterName: string;
  }): Promise<void> {
    try {
      const frontUrl = this.config.FRONT_URL?.replace(/\/$/, '') || 'http://localhost:3000';
      const invitationLink = `${frontUrl}/login`;
      const html = await this.fileUploadService.renderTemplate(
        {
          frontUrl,
          inviterName: params.inviterName,
          invitationCode: params.temporaryPassword,
          invitationLink,
        },
        'invitationRequestClient.ejs',
      );

      await this.emailService.sendMail({
        to: params.email,
        from: this.config.SMTP_SEND,
        subject: 'Invitation to join Biblio Squad',
        template: html,
        attachments: [this.emailService.getBiblioSquadLogoAttachment()],
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error(`Failed to send invitation email to ${params.email}`, detail);
    }
  }

  async fetchUsers(
    query: FetchUsersDto,
    pagination: PaginationData,
    orderBy: Record<string, any>[],
    searchWhere?: Prisma.UserWhereInput,
  ) {
    const andWhere = buildAndFilters<Prisma.UserWhereInput>(
      query.status ? { status: query.status } : undefined,
      query.role ? { role: query.role } : undefined,
      searchWhere,
    );

    const where: Prisma.UserWhereInput = composeWhere(
      { deletedAt: null },
      andWhere,
    ) as Prisma.UserWhereInput;

    const paginatedUserModel = ProxyPrismaModel(this.prismaService.user as any);
    const usersResult = await paginatedUserModel.findManyPaginated(
      {
        where,
        orderBy,
      },
      pagination,
    );

    const sanitizedData = usersResult.data.map(({ password, ...user }) => user);
    return {
      ...usersResult,
      data: sanitizedData,
    };
  }

  async getById(id: string): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const existing = await this.getById(id);

    if (existing.role === ERole.ADMIN && dto.status === EStatus.INACTIVE) {
      throw new BadRequestException('Cannot deactivate an administrator account');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.replaceAll(/\s+/g, '');
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    if (dto.status === EStatus.INACTIVE) {
      data.tokenVersion = { increment: 1 };
    }

    const updated = await this.prismaService.user.update({
      where: { id },
      data,
    });
    const { password, ...safeUser } = updated;
    return safeUser;
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.getById(id);

    if (existing.role === ERole.ADMIN) {
      throw new BadRequestException('Cannot delete an administrator account');
    }

    await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EStatus.INACTIVE,
        tokenVersion: { increment: 1 },
      },
    });
  }
}
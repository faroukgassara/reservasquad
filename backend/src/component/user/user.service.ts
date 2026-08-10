import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/dto/user/createUser.dto';
import { UpdateUserDto } from 'src/dto/user/updateUser.dto';
import * as bcrypt from 'bcrypt';
import { ERole, EStatus, Prisma, User } from 'src/generated/prisma/client';
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

    return createdUser;
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
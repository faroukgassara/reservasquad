import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/dto/user/createUser.dto';
import * as bcrypt from 'bcrypt';
import { EStatus, Prisma, User } from 'src/generated/prisma/client';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { FetchUsersDto } from 'src/dto/user/fetchUsers.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly commonFunction: CommonFunctionService,
  ) { }

  async createUser(user: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const createdUser = await this.prismaService.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        status: EStatus.ACTIVE,
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
}
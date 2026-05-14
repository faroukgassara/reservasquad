import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IEnv } from 'src/common/env/env';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/dto/user/createUser.dto';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';

import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CommonFunctionService } from 'src/common/common-services/common-function';
import { validateImgOrPdf } from 'src/common/validators/file.validator';
import { normalizeEmail } from 'src/common/utils/email.util';
import { FetchUsersDto } from 'src/dto/user/fetchUsers.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';
import { ApiPaginationQuery, PaginationQuery } from 'src/common/decorator/pagination-query.decorator';
import { ApiSortingQuery, SortingQuery } from 'src/common/decorator/sorting-query.decorator';
import { ApiSearchQuery, SearchQuery } from 'src/common/decorator/search-query.decorator';

const USER_SORTING_OPTIONS: SortingDecoratorOptions = {
    allowedFields: [
        'createdAt',
        'updatedAt',
        'firstName',
        'lastName',
        'email',
        'status',
        'role',
    ],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('user')
@Controller('user')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: "NOT_FOUND" },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' }
)

export class UserController {
    readonly config: IEnv
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly commonFunction: CommonFunctionService,
    ) {
        this.config = this.configService.get<IEnv>('env');
    }

    @Post('/create-user')
    @Public(true)
    @UseInterceptors(FilesInterceptor('files', null, validateImgOrPdf))
    @swagger.ApiConsumes('multipart/form-data')
    @swagger.ApiBody({ type: CreateUserDto })
    @swagger.ApiOperation({
        summary: 'Create a new user account',
        description: 'Allows creation of a user account.',
    })
    async createUser(
        @Res() res: Response,
        @Body() rawBody: any,
    ) {
        try {
            const body = plainToInstance(CreateUserDto, rawBody);
            const errors = await validate(body);
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map(err => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }
            const emailExists = await this.prismaService.user.findUnique({ where: { email: normalizeEmail(body.email) } });
            if (emailExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Email already exists'
                });
            }
            const user = await this.userService.createUser(body);
            if (!user) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Something went wrong.',
                });
            }
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                message: 'User created successfully.',
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }

    @Get('/list')
    @ApiBearerAuth('Authorization')
    @swagger.ApiOperation({
        summary: 'Fetch users with pagination, filters and search',
        description: 'Returns paginated users with optional filtering by status/role and text search.',
    })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(USER_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['firstName', 'lastName', 'email', 'phone', 'role'] })
    async fetchUsers(
        @Res() res: Response,
        @Query() query: FetchUsersDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 }) pagination: PaginationData,
        @SortingQuery(USER_SORTING_OPTIONS) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['firstName', 'lastName', 'email', 'phone', 'role'] }) searchWhere?: Record<string, any>,
    ) {
        try {
            const users = await this.userService.fetchUsers(query, pagination, orderBy, searchWhere);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: users,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            });
        }
    }
}

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { FetchUsersDto } from 'src/dto/user/fetchUsers.dto';
import { CreateUserDto } from 'src/dto/user/createUser.dto';
import { UpdateUserDto } from 'src/dto/user/updateUser.dto';
import {
    ApiPaginationQuery,
    PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import {
    ApiSortingQuery,
    SortingQuery,
} from 'src/common/decorator/sorting-query.decorator';
import {
    ApiSearchQuery,
    SearchQuery,
} from 'src/common/decorator/search-query.decorator';
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeEmail } from 'src/common/utils/email.util';
import { IRequest } from 'src/interface/request/request.interface';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

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

@swagger.ApiTags('user-backoffice')
@Controller('backoffice/user')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class UserBackofficeController {
    constructor(
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {}

    @Get('list')
    @swagger.ApiOperation({ summary: 'List users (admin)' })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(USER_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['firstName', 'lastName', 'email', 'phone'] })
    async list(
        @Res() res: Response,
        @Query() query: FetchUsersDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
        pagination: PaginationData,
        @SortingQuery(USER_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
        @SearchQuery({ fields: ['firstName', 'lastName', 'email', 'phone'] })
        searchWhere?: Record<string, unknown>,
    ) {
        try {
            const result = await this.userService.fetchUsers(
                query,
                pagination,
                orderBy,
                searchWhere as never,
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: result,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Post()
    @swagger.ApiOperation({ summary: 'Create user (admin)' })
    async create(@Res() res: Response, @Req() req: IRequest, @Body() body: CreateUserDto) {
        try {
            const dto = plainToInstance(CreateUserDto, body);
            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map((err) => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }

            const emailExists = await this.prismaService.user.findUnique({
                where: { email: normalizeEmail(dto.email) },
            });
            if (emailExists) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Email already exists',
                });
            }

            const inviterName =
                [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() ||
                'Biblio Squad';
            const user = await this.userService.createUser(dto, inviterName);
            const { password, ...safeUser } = user;
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: safeUser,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Patch(':id')
    @swagger.ApiOperation({ summary: 'Update user (admin)' })
    async update(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateUserDto,
    ) {
        try {
            const dto = plainToInstance(UpdateUserDto, body);
            const errors = await validate(dto, { skipMissingProperties: true });
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map((err) => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }

            const user = await this.userService.updateUser(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: user,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete user (admin)' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.userService.deleteUser(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

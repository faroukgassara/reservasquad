import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolvePagination } from 'src/common/pagination/prisma-query.builder';
import { PaginationData, PaginationDecoratorOptions } from 'src/common/pagination/types';
import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export const PaginationQuery = createParamDecorator(
    (options: PaginationDecoratorOptions | undefined, ctx: ExecutionContext): PaginationData => {
        const request = ctx.switchToHttp().getRequest();
        const page = Number(request.query?.page);
        const perPage = Number(request.query?.perPage);

        return resolvePagination(page, perPage, options);
    },
);

export const ApiPaginationQuery = (options?: PaginationDecoratorOptions) =>
    applyDecorators(
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            description: 'Page number (starts at 1)',
            example: options?.defaultPage ?? 1,
        }),
        ApiQuery({
            name: 'perPage',
            required: false,
            type: Number,
            description: `Items per page${options?.maxPerPage ? ` (max ${options.maxPerPage})` : ''}`,
            example: options?.defaultPerPage ?? 10,
        }),
    );

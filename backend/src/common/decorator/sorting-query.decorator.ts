import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ESort } from 'src/enum/sort.enum';
import { buildOrderBy } from 'src/common/pagination/prisma-query.builder';
import { SortingDecoratorOptions } from 'src/common/pagination/types';
import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export const SortingQuery = createParamDecorator(
    (options: SortingDecoratorOptions, ctx: ExecutionContext): Record<string, any>[] => {
        const request = ctx.switchToHttp().getRequest();
        const sortBy = request.query?.sortBy as string | undefined;
        const rawSortOrder = request.query?.sortOrder as string | undefined;
        const sortOrder = rawSortOrder === ESort.asc ? ESort.asc : ESort.desc;

        return buildOrderBy(
            sortBy,
            sortOrder,
            options.allowedFields,
            options.defaultSort || options.allowedFields[0],
        );
    },
);

export const ApiSortingQuery = (options: SortingDecoratorOptions) =>
    applyDecorators(
        ApiQuery({
            name: 'sortBy',
            required: false,
            type: String,
            description: `Sort field. Allowed: ${options.allowedFields.join(', ')}`,
            example: options.defaultSort || options.allowedFields[0],
        }),
        ApiQuery({
            name: 'sortOrder',
            required: false,
            enum: ESort,
            description: 'Sort direction',
            example: options.defaultOrder || ESort.desc,
        }),
    );

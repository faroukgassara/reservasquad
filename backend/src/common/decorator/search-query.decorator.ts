import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { buildSearchWhere } from 'src/common/pagination/prisma-query.builder';
import { ApiQuery } from '@nestjs/swagger';

type SearchQueryOptions = {
    fields: string[];
    queryParamName?: string;
    description?: string;
};

export const SearchQuery = createParamDecorator(
    (options: SearchQueryOptions, ctx: ExecutionContext): Record<string, any> | undefined => {
        const request = ctx.switchToHttp().getRequest();
        const queryParamName = options?.queryParamName || 'search';
        const search = request.query?.[queryParamName] as string | undefined;

        return buildSearchWhere(search, options.fields);
    },
);

export const ApiSearchQuery = (options: SearchQueryOptions) =>
    ApiQuery({
        name: options.queryParamName || 'search',
        required: false,
        type: String,
        description: options.description || `Search term applied on: ${options.fields.join(', ')}`,
        example: 'john',
    });

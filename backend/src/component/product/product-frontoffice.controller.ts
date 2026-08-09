import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductService } from './product.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { FetchProductsDto } from 'src/dto/product/fetchProducts.dto';
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
import {
    PaginationData,
    SortingDecoratorOptions,
} from 'src/common/pagination/types';
import { EStatus } from 'src/generated/prisma/client';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const PRODUCT_SORTING_OPTIONS: SortingDecoratorOptions = {
    allowedFields: [
        'createdAt',
        'updatedAt',
        'title',
        'price',
        'featured',
    ],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('product-frontoffice')
@Controller('product')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ProductFrontofficeController {
    constructor(private readonly productService: ProductService) {}

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List products (public)',
        description:
            'Fetch active products with pagination. Only ACTIVE products are returned.',
    })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 50 })
    @ApiSortingQuery(PRODUCT_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['title', 'description'] })
    async listProducts(
        @Res() res: Response,
        @Query() query: FetchProductsDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 50 })
        pagination: PaginationData,
        @SortingQuery(PRODUCT_SORTING_OPTIONS) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['title', 'description'] })
        searchWhere?: Record<string, any>,
    ) {
        try {
            const frontofficeQuery: FetchProductsDto = {
                ...query,
                status: EStatus.ACTIVE,
            };
            const result = await this.productService.fetchProducts(
                frontofficeQuery,
                pagination,
                orderBy,
                searchWhere,
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: result,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('slug/:slug')
    @swagger.ApiOperation({
        summary: 'Get product by slug (public)',
        description: 'Get a single product by slug. Only ACTIVE products.',
    })
    async getProductBySlug(
        @Res() res: Response,
        @Param('slug') slug: string,
    ) {
        try {
            const product = await this.productService.getProductBySlug(slug);
            if (product.status !== EStatus.ACTIVE) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Product not found',
                });
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: product,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get(':id')
    @swagger.ApiOperation({
        summary: 'Get product by ID (public)',
        description: 'Get a single product by ID. Only ACTIVE products.',
    })
    async getProductById(@Res() res: Response, @Param('id') id: string) {
        try {
            const product = await this.productService.getProductById(id);
            if (product.status !== EStatus.ACTIVE) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Product not found',
                });
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: product,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

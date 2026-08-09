import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductService } from './product.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateProductDto } from 'src/dto/product/createProduct.dto';
import { UpdateProductDto } from 'src/dto/product/updateProduct.dto';
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
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const PRODUCT_SORTING_OPTIONS: SortingDecoratorOptions = {
    allowedFields: [
        'createdAt',
        'updatedAt',
        'title',
        'price',
        'featured',
        'status',
    ],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('product-backoffice')
@Controller('backoffice/product')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class ProductBackofficeController {
    constructor(private readonly productService: ProductService) { }

    @Post()
    @swagger.ApiOperation({
        summary: 'Create a product',
        description: 'Create a new product (admin only).',
    })
    async createProduct(@Res() res: Response, @Body() body: CreateProductDto) {
        try {
            const dto = plainToInstance(CreateProductDto, body);
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
            const product = await this.productService.createProduct(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: product,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Post(':id')
    @swagger.ApiOperation({
        summary: 'Update a product',
        description: 'Update an existing product (admin only).',
    })
    async updateProduct(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateProductDto,
    ) {
        try {
            const dto = plainToInstance(UpdateProductDto, body);
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
            const product = await this.productService.updateProduct(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: product,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('/list')
    @swagger.ApiOperation({
        summary: 'List products (admin)',
        description: 'Fetch products with pagination, filters and search.',
    })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(PRODUCT_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['title', 'description'] })
    async fetchProducts(
        @Res() res: Response,
        @Query() query: FetchProductsDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
        pagination: PaginationData,
        @SortingQuery(PRODUCT_SORTING_OPTIONS) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['title', 'description'] })
        searchWhere?: Record<string, any>,
    ) {
        try {
            const result = await this.productService.fetchProducts(
                query,
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

    @Get(':id')
    @swagger.ApiOperation({
        summary: 'Get product by ID',
        description: 'Get a single product by ID (admin only).',
    })
    async getProductById(@Res() res: Response, @Param('id') id: string) {
        try {
            const product = await this.productService.getProductById(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: product,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({
        summary: 'Delete a product',
        description: 'Soft delete a product (admin only).',
    })
    async deleteProduct(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.productService.deleteProduct(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Product deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

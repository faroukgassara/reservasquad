import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductCategoryService } from './product-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateProductCategoryDto } from 'src/dto/productCategory/createProductCategory.dto';
import { UpdateProductCategoryDto } from 'src/dto/productCategory/updateProductCategory.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('product-category-backoffice')
@Controller('backoffice/product-category')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class ProductCategoryBackofficeController {
    constructor(private readonly productCategoryService: ProductCategoryService) {}

    @Post()
    @swagger.ApiOperation({
        summary: 'Create a product category',
        description: 'Create a new product category (admin only).',
    })
    async createCategory(
        @Res() res: Response,
        @Body() body: CreateProductCategoryDto,
    ) {
        try {
            const dto = plainToInstance(CreateProductCategoryDto, body);
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
            const category = await this.productCategoryService.createCategory(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: category,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Post(':id')
    @swagger.ApiOperation({
        summary: 'Update a product category',
        description: 'Update an existing product category (admin only).',
    })
    async updateCategory(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateProductCategoryDto,
    ) {
        try {
            const dto = plainToInstance(UpdateProductCategoryDto, body);
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
            const category = await this.productCategoryService.updateCategory(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: category,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List product categories',
        description: 'List all product categories (admin only).',
    })
    async listCategories(@Res() res: Response) {
        try {
            const categories = await this.productCategoryService.listCategories();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: categories,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({
        summary: 'Delete a product category',
        description:
            'Delete a product category (admin only). Fails if products are attached.',
    })
    async deleteCategory(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.productCategoryService.deleteCategory(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Category deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

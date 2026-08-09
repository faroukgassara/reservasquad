import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductCategoryService } from './product-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('product-category-frontoffice')
@Controller('product-category')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ProductCategoryFrontofficeController {
    constructor(private readonly productCategoryService: ProductCategoryService) {}

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List product categories (public)',
        description: 'List ACTIVE product categories for filtering.',
    })
    async listCategories(@Res() res: Response) {
        try {
            const categories =
                await this.productCategoryService.listActiveCategories();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: categories,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

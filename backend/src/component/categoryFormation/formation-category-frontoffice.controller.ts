import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { FormationCategoryService } from './formation-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';

@swagger.ApiTags('formation-category-frontoffice')
@Controller('formation-category')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class FormationCategoryFrontofficeController {
    constructor(private readonly formationCategoryService: FormationCategoryService) {}

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List formation categories (public)',
        description: 'List all formation categories for filtering.',
    })
    async listCategories(@Res() res: Response) {
        try {
            const categories = await this.formationCategoryService.listCategories();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: categories,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }
}

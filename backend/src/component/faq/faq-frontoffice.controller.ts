import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FaqService } from './faq.service';
import { FaqCategoryService } from './faq-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('faq-frontoffice')
@Controller('faq')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class FaqFrontofficeController {
    constructor(
        private readonly faqService: FaqService,
        private readonly faqCategoryService: FaqCategoryService,
    ) {}

    @Get('list')
    @swagger.ApiOperation({ summary: 'List active FAQ entries' })
    async list(
        @Res() res: Response,
        @Query('take') takeRaw?: string,
        @Query('categoryId') categoryId?: string,
    ) {
        try {
            const take = takeRaw ? Math.min(100, Math.max(1, parseInt(takeRaw, 10) || 100)) : undefined;
            const faqs = await this.faqService.listPublic(take, categoryId);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: faqs,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('categories')
    @swagger.ApiOperation({ summary: 'List active FAQ categories with nested FAQs' })
    async categoriesWithFaqs(@Res() res: Response) {
        try {
            const categories = await this.faqCategoryService.listPublicWithFaqs();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: categories,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

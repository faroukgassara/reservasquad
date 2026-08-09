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
import { FaqCategoryService } from './faq-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateFaqCategoryDto } from 'src/dto/faqCategory/createFaqCategory.dto';
import { UpdateFaqCategoryDto } from 'src/dto/faqCategory/updateFaqCategory.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('faq-category-backoffice')
@Controller('backoffice/faq-category')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class FaqCategoryBackofficeController {
    constructor(private readonly faqCategoryService: FaqCategoryService) {}

    @Post()
    @swagger.ApiOperation({ summary: 'Create FAQ category' })
    async create(@Res() res: Response, @Body() body: CreateFaqCategoryDto) {
        try {
            const dto = plainToInstance(CreateFaqCategoryDto, body);
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
            const category = await this.faqCategoryService.create(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: category,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Post(':id')
    @swagger.ApiOperation({ summary: 'Update FAQ category' })
    async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateFaqCategoryDto) {
        try {
            const dto = plainToInstance(UpdateFaqCategoryDto, body);
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
            const category = await this.faqCategoryService.update(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: category,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('list')
    @swagger.ApiOperation({ summary: 'List FAQ categories (admin)' })
    async list(@Res() res: Response) {
        try {
            const categories = await this.faqCategoryService.listAdmin();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: categories,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete FAQ category' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.faqCategoryService.delete(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'FAQ category deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

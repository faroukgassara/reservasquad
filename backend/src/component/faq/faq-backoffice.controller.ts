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
import { FaqService } from './faq.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateFaqDto } from 'src/dto/faq/createFaq.dto';
import { UpdateFaqDto } from 'src/dto/faq/updateFaq.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('faq-backoffice')
@Controller('backoffice/faq')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class FaqBackofficeController {
    constructor(private readonly faqService: FaqService) {}

    @Post()
    @swagger.ApiOperation({ summary: 'Create FAQ entry' })
    async create(@Res() res: Response, @Body() body: CreateFaqDto) {
        try {
            const dto = plainToInstance(CreateFaqDto, body);
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
            const faq = await this.faqService.create(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: faq,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Post(':id')
    @swagger.ApiOperation({ summary: 'Update FAQ entry' })
    async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateFaqDto) {
        try {
            const dto = plainToInstance(UpdateFaqDto, body);
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
            const faq = await this.faqService.update(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: faq,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('list')
    @swagger.ApiOperation({ summary: 'List FAQ entries (admin)' })
    async list(@Res() res: Response) {
        try {
            const faqs = await this.faqService.listAdmin();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: faqs,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete FAQ entry' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.faqService.delete(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'FAQ deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

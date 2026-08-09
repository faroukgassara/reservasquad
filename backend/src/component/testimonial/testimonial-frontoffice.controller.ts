import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TestimonialService } from './testimonial.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { CreateTestimonialDto } from 'src/dto/testimonial/createTestimonial.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('testimonial-frontoffice')
@Controller('testimonial')
@Public(true)
@openApiResponse(
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class TestimonialFrontofficeController {
    constructor(private readonly testimonialService: TestimonialService) {}

    @Post()
    @swagger.ApiOperation({ summary: 'Submit testimonial (public, pending approval)' })
    async create(@Res() res: Response, @Body() body: CreateTestimonialDto) {
        try {
            const dto = plainToInstance(CreateTestimonialDto, body);
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

            const created = await this.testimonialService.create(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: created,
                message: 'Testimonial submitted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Get('list')
    @swagger.ApiOperation({ summary: 'List approved testimonials (public)' })
    async list(@Res() res: Response, @Query('take') takeRaw?: string) {
        try {
            const take = Math.min(50, Math.max(1, parseInt(takeRaw ?? '12', 10) || 12));
            const testimonials = await this.testimonialService.listPublic(take);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: testimonials,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

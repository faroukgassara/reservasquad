import {
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Query,
    Res,
    Body,
} from '@nestjs/common';
import { Response } from 'express';
import { TestimonialService } from './testimonial.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { FetchTestimonialsDto } from 'src/dto/testimonial/fetchTestimonials.dto';
import { UpdateTestimonialStatusDto } from 'src/dto/testimonial/updateTestimonialStatus.dto';
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
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const TESTIMONIAL_SORTING: SortingDecoratorOptions = {
    allowedFields: ['createdAt', 'firstName', 'lastName', 'email', 'title', 'rating', 'status'],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('testimonial-backoffice')
@Controller('backoffice/testimonial')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class TestimonialBackofficeController {
    constructor(private readonly testimonialService: TestimonialService) {}

    @Get('list')
    @swagger.ApiOperation({ summary: 'List testimonials (admin)' })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(TESTIMONIAL_SORTING)
    @ApiSearchQuery({ fields: ['firstName', 'lastName', 'email', 'title', 'description'] })
    async list(
        @Res() res: Response,
        @Query() query: FetchTestimonialsDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
        pagination: PaginationData,
        @SortingQuery(TESTIMONIAL_SORTING) orderBy: Record<string, unknown>[],
        @SearchQuery({ fields: ['firstName', 'lastName', 'email', 'title', 'description'] })
        searchWhere?: Record<string, unknown>,
    ) {
        try {
            const result = await this.testimonialService.fetchTestimonials(
                pagination,
                orderBy,
                { status: query.status },
                searchWhere as never,
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: result,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Patch(':id/status')
    @swagger.ApiOperation({ summary: 'Approve or reject testimonial' })
    async updateStatus(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateTestimonialStatusDto,
    ) {
        try {
            const dto = plainToInstance(UpdateTestimonialStatusDto, body);
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

            const updated = await this.testimonialService.updateStatus(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: updated,
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete testimonial' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.testimonialService.delete(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Deleted successfully',
            });
        } catch (error: unknown) {
            return sendCaughtError(res, error);
        }
    }
}

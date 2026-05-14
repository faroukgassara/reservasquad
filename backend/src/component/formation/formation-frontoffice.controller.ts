import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FormationService } from './formation.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { FetchFormationsDto } from 'src/dto/formation/fetchFormations.dto';
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

const FORMATION_SORTING_OPTIONS: SortingDecoratorOptions = {
    allowedFields: [
        'createdAt',
        'updatedAt',
        'title',
        'duration',
        'price',
    ],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('formation-frontoffice')
@Controller('formation')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class FormationFrontofficeController {
    constructor(private readonly formationService: FormationService) {}

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List formations (public)',
        description: 'Fetch active formations with pagination. Only ACTIVE formations are returned.',
    })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 50 })
    @ApiSortingQuery(FORMATION_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['title', 'description'] })
    async listFormations(
        @Res() res: Response,
        @Query() query: FetchFormationsDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 50 })
        pagination: PaginationData,
        @SortingQuery(FORMATION_SORTING_OPTIONS) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['title', 'description'] })
        searchWhere?: Record<string, any>,
    ) {
        try {
            // Frontoffice: only show ACTIVE formations
            const frontofficeQuery: FetchFormationsDto = {
                ...query,
                status: EStatus.ACTIVE,
            };
            const result = await this.formationService.fetchFormations(
                frontofficeQuery,
                pagination,
                orderBy,
                searchWhere,
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: result,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Get('slug/:slug')
    @swagger.ApiOperation({
        summary: 'Get formation by slug (public)',
        description: 'Get a single formation by slug. Only ACTIVE formations.',
    })
    async getFormationBySlug(
        @Res() res: Response,
        @Param('slug') slug: string,
    ) {
        try {
            const formation = await this.formationService.getFormationBySlug(slug);
            if (formation.status !== EStatus.ACTIVE) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Formation not found',
                });
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: formation,
            });
        } catch (error) {
            if (error?.statusCode === HttpStatus.NOT_FOUND) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: error.message,
                });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Get(':id')
    @swagger.ApiOperation({
        summary: 'Get formation by ID (public)',
        description: 'Get a single formation by ID. Only ACTIVE formations.',
    })
    async getFormationById(@Res() res: Response, @Param('id') id: string) {
        try {
            const formation = await this.formationService.getFormationById(id);
            if (formation.status !== EStatus.ACTIVE) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Formation not found',
                });
            }
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: formation,
            });
        } catch (error) {
            if (error?.statusCode === HttpStatus.NOT_FOUND) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: error.message,
                });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }
}

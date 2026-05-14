import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param, Post,
    Query,
    Res
} from '@nestjs/common';
import { Response } from 'express';
import { FormationService } from './formation.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateFormationDto } from 'src/dto/formation/createFormation.dto';
import { UpdateFormationDto } from 'src/dto/formation/updateFormation.dto';
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
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const FORMATION_SORTING_OPTIONS: SortingDecoratorOptions = {
    allowedFields: [
        'createdAt',
        'updatedAt',
        'title',
        'duration',
        'price',
        'status',
    ],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('formation-backoffice')
@Controller('backoffice/formation')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class FormationBackofficeController {
    constructor(private readonly formationService: FormationService) {}

    // --- Formation ---

    @Post()
    @swagger.ApiOperation({
        summary: 'Create a formation',
        description: 'Create a new formation (admin only).',
    })
    async createFormation(@Res() res: Response, @Body() body: CreateFormationDto) {
        try {
            const dto = plainToInstance(CreateFormationDto, body);
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
            const formation = await this.formationService.createFormation(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: formation,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Post(':id')
    @swagger.ApiOperation({
        summary: 'Update a formation',
        description: 'Update an existing formation (admin only).',
    })
    async updateFormation(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateFormationDto,
    ) {
        try {
            const dto = plainToInstance(UpdateFormationDto, body);
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
            const formation = await this.formationService.updateFormation(id, dto);
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

    @Get('/list')
    @swagger.ApiOperation({
        summary: 'List formations (admin)',
        description: 'Fetch formations with pagination, filters and search.',
    })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(FORMATION_SORTING_OPTIONS)
    @ApiSearchQuery({ fields: ['title', 'description'] })
    async fetchFormations(
        @Res() res: Response,
        @Query() query: FetchFormationsDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
        pagination: PaginationData,
        @SortingQuery(FORMATION_SORTING_OPTIONS) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['title', 'description'] })
        searchWhere?: Record<string, any>,
    ) {
        console.log(query);
        try {
            const result = await this.formationService.fetchFormations(
                query,
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

    @Get(':id')
    @swagger.ApiOperation({
        summary: 'Get formation by ID',
        description: 'Get a single formation by ID (admin only).',
    })
    async getFormationById(@Res() res: Response, @Param('id') id: string) {
        try {
            const formation = await this.formationService.getFormationById(id);
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

    @Post(':id/archive')
    @swagger.ApiOperation({
        summary: 'Archive a formation',
        description: 'Set formation status to INACTIVE (admin only).',
    })
    async archiveFormation(@Res() res: Response, @Param('id') id: string) {
        try {
            const formation = await this.formationService.archiveFormation(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: formation,
                message: 'Formation archived successfully',
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

    @Post(':id/unarchive')
    @swagger.ApiOperation({
        summary: 'Unarchive a formation',
        description: 'Set formation status to ACTIVE (admin only).',
    })
    async unarchiveFormation(@Res() res: Response, @Param('id') id: string) {
        try {
            const formation = await this.formationService.unarchiveFormation(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: formation,
                message: 'Formation unarchived successfully',
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

    @Delete(':id')
    @swagger.ApiOperation({
        summary: 'Delete a formation',
        description: 'Soft delete a formation (admin only).',
    })
    async deleteFormation(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.formationService.deleteFormation(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Formation deleted successfully',
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

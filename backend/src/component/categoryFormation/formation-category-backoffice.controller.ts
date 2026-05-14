import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param, Post,
    Res
} from '@nestjs/common';
import { Response } from 'express';
import { FormationCategoryService } from './formation-category.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateFormationCategoryDto } from 'src/dto/formationCategory/createFormationCategory.dto';
import { UpdateFormationCategoryDto } from 'src/dto/formationCategory/updateFormationCategory.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@swagger.ApiTags('formation-category-backoffice')
@Controller('backoffice/formation-category')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class FormationCategoryBackofficeController {
    constructor(private readonly formationCategoryService: FormationCategoryService) {}

    @Post()
    @swagger.ApiOperation({
        summary: 'Create a formation category',
        description: 'Create a new formation category (admin only).',
    })
    async createCategory(
        @Res() res: Response,
        @Body() body: CreateFormationCategoryDto,
    ) {
        try {
            const dto = plainToInstance(CreateFormationCategoryDto, body);
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
            const category = await this.formationCategoryService.createCategory(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: category,
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
        summary: 'Update a formation category',
        description: 'Update an existing formation category (admin only).',
    })
    async updateCategory(
        @Res() res: Response,
        @Param('id') id: string,
        @Body() body: UpdateFormationCategoryDto,
    ) {
        console.log("body",body);
        try {
            const dto = plainToInstance(UpdateFormationCategoryDto, body);
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
            const category = await this.formationCategoryService.updateCategory(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: category,
            });
        } catch (error) {
            console.log(error);
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

    @Get('list')
    @swagger.ApiOperation({
        summary: 'List formation categories',
        description: 'List all formation categories (admin only).',
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

    @Delete(':id')
    @swagger.ApiOperation({
        summary: 'Delete a formation category',
        description: 'Delete a formation category (admin only).',
    })
    async deleteCategory(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.formationCategoryService.deleteCategory(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Category deleted successfully',
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

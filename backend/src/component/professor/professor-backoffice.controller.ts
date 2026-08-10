import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ProfessorService } from './professor.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateProfessorDto } from 'src/dto/professor/createProfessor.dto';
import { UpdateProfessorDto } from 'src/dto/professor/updateProfessor.dto';
import { FetchProfessorsDto } from 'src/dto/professor/fetchProfessors.dto';
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

const PROFESSOR_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'updatedAt', 'firstName', 'lastName'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('professor-backoffice')
@Controller('backoffice/professor')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ProfessorBackofficeController {
  constructor(private readonly professorService: ProfessorService) {}

  @Post()
  @Roles({ roles: ['ADMIN', 'USER'] })
  @swagger.ApiOperation({ summary: 'Create a professor' })
  async create(@Res() res: Response, @Body() body: CreateProfessorDto) {
    try {
      const dto = plainToInstance(CreateProfessorDto, body);
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
      const professor = await this.professorService.createProfessor(dto);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data: professor });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @Roles({ roles: ['ADMIN', 'USER'] })
  @swagger.ApiOperation({ summary: 'Update a professor' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateProfessorDto,
  ) {
    try {
      const dto = plainToInstance(UpdateProfessorDto, body);
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
      const professor = await this.professorService.updateProfessor(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: professor });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('list')
  @swagger.ApiOperation({ summary: 'List professors' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(PROFESSOR_SORTING_OPTIONS)
  @ApiSearchQuery({ fields: ['firstName', 'lastName', 'email', 'specialty'] })
  async list(
    @Res() res: Response,
    @Query() query: FetchProfessorsDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(PROFESSOR_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
    @SearchQuery({ fields: ['firstName', 'lastName', 'email', 'specialty'] }) search: object,
  ) {
    try {
      const data = await this.professorService.listProfessors(
        query,
        pagination,
        orderBy,
        search as never,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Get professor by id' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const professor = await this.professorService.getProfessorById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: professor });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Soft-delete a professor' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const professor = await this.professorService.softDeleteProfessor(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: professor });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

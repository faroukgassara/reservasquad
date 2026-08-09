import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
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
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from 'src/dto/sales/customer.dto';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const SORTING: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'name', 'email', 'company', 'status'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('customer-backoffice')
@Controller('backoffice/customer')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class CustomerBackofficeController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('list')
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(SORTING)
  @ApiSearchQuery({ fields: ['name', 'email', 'phone', 'company', 'vatNumber'] })
  async list(
    @Res() res: Response,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(SORTING) orderBy: Record<string, unknown>[],
    @SearchQuery({ fields: ['name', 'email', 'phone', 'company', 'vatNumber'] })
    searchWhere?: Record<string, unknown>,
  ) {
    const result = await this.customerService.list(pagination, orderBy, searchWhere as never);
    return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: result });
  }

  @Get('all')
  async listAll(@Res() res: Response) {
    const data = await this.customerService.listAll();
    return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
  }

  @Get(':id')
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.customerService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  async create(@Res() res: Response, @Body() body: CreateCustomerDto) {
    const dto = plainToInstance(CreateCustomerDto, body);
    const errors = await validate(dto);
    if (errors.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
      });
    }
    const data = await this.customerService.create(dto);
    return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateCustomerDto) {
    const dto = plainToInstance(UpdateCustomerDto, body);
    const errors = await validate(dto, { skipMissingProperties: true });
    if (errors.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
      });
    }
    try {
      const data = await this.customerService.update(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.customerService.delete(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'Deleted' });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

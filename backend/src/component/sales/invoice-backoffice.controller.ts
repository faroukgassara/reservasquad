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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from 'src/dto/sales/invoice.dto';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const SORTING: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'number', 'status', 'total', 'issueDate', 'dueDate'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('invoice-backoffice')
@Controller('backoffice/invoice')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class InvoiceBackofficeController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('list')
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(SORTING)
  @ApiSearchQuery({ fields: ['number', 'status'] })
  async list(
    @Res() res: Response,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(SORTING) orderBy: Record<string, unknown>[],
    @SearchQuery({ fields: ['number', 'status'] }) searchWhere?: Record<string, unknown>,
  ) {
    const result = await this.invoiceService.list(pagination, orderBy, searchWhere as never);
    return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: result });
  }

  @Get(':id')
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  async create(@Res() res: Response, @Body() body: CreateInvoiceDto) {
    const dto = plainToInstance(CreateInvoiceDto, body);
    const errors = await validate(dto);
    if (errors.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
      });
    }
    try {
      const data = await this.invoiceService.create(dto);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateInvoiceDto) {
    const dto = plainToInstance(UpdateInvoiceDto, body);
    const errors = await validate(dto, { skipMissingProperties: true });
    if (errors.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
      });
    }
    try {
      const data = await this.invoiceService.update(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/mark-paid')
  async markPaid(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.markPaid(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.invoiceService.delete(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'Deleted' });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

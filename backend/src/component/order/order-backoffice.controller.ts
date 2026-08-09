import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as swagger from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
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
import { FetchOrdersDto } from 'src/dto/order/fetchOrders.dto';
import { UpdateOrderStatusDto } from 'src/dto/order/updateOrderStatus.dto';
import { OrderService } from './order.service';

const ORDER_SORTING: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'number', 'total', 'status', 'email', 'firstName', 'lastName'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('order-backoffice')
@Controller('backoffice/order')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class OrderBackofficeController {
  constructor(private readonly orderService: OrderService) {}

  @Get('list')
  @swagger.ApiOperation({ summary: 'List shop orders (admin)' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(ORDER_SORTING)
  @ApiSearchQuery({
    fields: ['number', 'email', 'phone', 'firstName', 'lastName', 'city', 'governorate'],
  })
  async list(
    @Res() res: Response,
    @Query() query: FetchOrdersDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(ORDER_SORTING) orderBy: Record<string, unknown>[],
    @SearchQuery({
      fields: ['number', 'email', 'phone', 'firstName', 'lastName', 'city', 'governorate'],
    })
    searchWhere?: Record<string, unknown>,
  ) {
    try {
      const result = await this.orderService.fetchOrders(
        pagination,
        orderBy,
        searchWhere,
        query.status,
      );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: result,
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Get order details (admin)' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const order = await this.orderService.getById(id);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: order,
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Patch(':id/status')
  @swagger.ApiOperation({ summary: 'Update order status (admin)' })
  async updateStatus(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    try {
      const dto = plainToInstance(UpdateOrderStatusDto, body);
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

      const updated = await this.orderService.updateStatus(id, dto.status);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: updated,
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @swagger.ApiOperation({ summary: 'Delete order (admin)' })
  async delete(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.orderService.delete(id);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

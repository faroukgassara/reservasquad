import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  ApiPaginationQuery,
  PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import { PaginationData } from 'src/common/pagination/types';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import {
  CreatePosOrderDto,
  FetchPosOrdersDto,
  RefundPosOrderDto,
} from 'src/dto/pos/posOrder.dto';
import { PosOrderService } from './pos-order.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-order-backoffice')
@Controller('backoffice/pos/orders')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosOrderController {
  constructor(private readonly orderService: PosOrderService) {}

  @Get('list')
  @swagger.ApiOperation({ summary: 'List POS orders' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async list(
    @Res() res: Response,
    @Query() query: FetchPosOrdersDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.orderService.list(query, pagination);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @swagger.ApiOperation({ summary: 'Validate and pay an order' })
  async create(@Res() res: Response, @Req() req: IRequest, @Body() body: CreatePosOrderDto) {
    try {
      const dto = await validateBody(CreatePosOrderDto, body, res);
      if (!dto) return;
      const data = await this.orderService.create(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Order detail' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.orderService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/refund')
  @swagger.ApiOperation({ summary: 'Refund some lines of a paid order' })
  async refund(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: RefundPosOrderDto,
  ) {
    try {
      const dto = await validateBody(RefundPosOrderDto, body, res);
      if (!dto) return;
      const data = await this.orderService.refund(id, dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

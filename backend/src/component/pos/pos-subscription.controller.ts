import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
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
  FetchSubscriptionsDto,
  RenewSubscriptionDto,
  SaveSubscriptionDto,
} from 'src/dto/pos/posSubscription.dto';
import { PosSubscriptionService } from './pos-subscription.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-subscription-backoffice')
@Controller('backoffice/pos/subscriptions')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosSubscriptionController {
  constructor(private readonly subscriptionService: PosSubscriptionService) {}

  @Get('list')
  @swagger.ApiOperation({ summary: 'List coworking subscriptions' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async list(
    @Res() res: Response,
    @Query() query: FetchSubscriptionsDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.subscriptionService.list(query, pagination);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @swagger.ApiOperation({ summary: 'Create a draft subscription' })
  async create(@Res() res: Response, @Req() req: IRequest, @Body() body: SaveSubscriptionDto) {
    try {
      const dto = await validateBody(SaveSubscriptionDto, body, res);
      if (!dto) return;
      const data = await this.subscriptionService.create(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Subscription detail' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.subscriptionService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @swagger.ApiOperation({ summary: 'Update a draft subscription' })
  async update(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: SaveSubscriptionDto,
  ) {
    try {
      const dto = await validateBody(SaveSubscriptionDto, body, res);
      if (!dto) return;
      const data = await this.subscriptionService.update(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/activate')
  @swagger.ApiOperation({ summary: 'Activate a draft subscription' })
  async activate(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.subscriptionService.activate(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/cancel')
  @swagger.ApiOperation({ summary: 'Cancel a subscription' })
  async cancel(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.subscriptionService.cancel(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/renew')
  @swagger.ApiOperation({ summary: 'Create the next period as a draft subscription' })
  async renew(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: RenewSubscriptionDto,
  ) {
    try {
      const dto = await validateBody(RenewSubscriptionDto, body, res);
      if (!dto) return;
      const data = await this.subscriptionService.renew(id, dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a draft or cancelled subscription' })
  async remove(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.subscriptionService.remove(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

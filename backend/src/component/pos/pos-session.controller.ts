import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
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
import { ClosePosSessionDto, OpenPosSessionDto } from 'src/dto/pos/posSession.dto';
import { PosSessionService } from './pos-session.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-session-backoffice')
@Controller('backoffice/pos/sessions')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosSessionController {
  constructor(private readonly sessionService: PosSessionService) {}

  @Get('current')
  @swagger.ApiOperation({ summary: 'Currently open session (or null)' })
  async current(@Res() res: Response) {
    try {
      const data = await this.sessionService.getCurrent();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('last-closed')
  @swagger.ApiOperation({ summary: 'Most recently closed session (or null)' })
  async lastClosed(@Res() res: Response) {
    try {
      const data = await this.sessionService.getLastClosed();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('list')
  @swagger.ApiOperation({ summary: 'Session history' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async list(
    @Res() res: Response,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.sessionService.list(pagination);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('open')
  @swagger.ApiOperation({ summary: 'Open a session with a starting cash amount' })
  async open(@Res() res: Response, @Req() req: IRequest, @Body() body: OpenPosSessionDto) {
    try {
      const dto = await validateBody(OpenPosSessionDto, body, res);
      if (!dto) return;
      const data = await this.sessionService.open(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id/summary')
  @swagger.ApiOperation({ summary: 'Totals per payment method and expected cash' })
  async summary(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.sessionService.getSummary(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/close')
  @swagger.ApiOperation({ summary: 'Close a session with the counted cash' })
  async close(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: ClosePosSessionDto,
  ) {
    try {
      const dto = await validateBody(ClosePosSessionDto, body, res);
      if (!dto) return;
      const data = await this.sessionService.close(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

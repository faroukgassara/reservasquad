import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import {
  FetchPortalReservationsDto,
  PortalBookDto,
  PortalRangeDto,
  PortalScheduleDto,
} from 'src/dto/portal/portal.dto';
import { IRequest } from 'src/interface/request/request.interface';
import { PortalService } from './portal.service';

@swagger.ApiTags('professor-portal')
@Controller('portal')
@Roles({ roles: ['PROFESSOR'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.CONFLICT, description: 'CONFLICT' },
  { status: HttpStatus.FORBIDDEN, description: 'FORBIDDEN' },
)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  @swagger.ApiOperation({ summary: 'My profile, balance and upcoming bookings' })
  async me(@Req() req: IRequest, @Res() res: Response) {
    try {
      const data = await this.portalService.me(req.user.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('rooms')
  @swagger.ApiOperation({ summary: 'Bookable rooms' })
  async rooms(@Res() res: Response) {
    try {
      const data = await this.portalService.rooms();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('schedule')
  @swagger.ApiOperation({ summary: 'Busy slots per room for a date range (max 43 days)' })
  async schedule(@Req() req: IRequest, @Res() res: Response, @Query() query: PortalScheduleDto) {
    try {
      const data = await this.portalService.schedule(req.user.id, query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('availability')
  @swagger.ApiOperation({ summary: 'Rooms free for a time range, with my price' })
  async availability(@Req() req: IRequest, @Res() res: Response, @Query() query: PortalRangeDto) {
    try {
      const data = await this.portalService.availability(req.user.id, query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('reservations')
  @swagger.ApiOperation({ summary: 'My booking history' })
  async reservations(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query() query: FetchPortalReservationsDto,
  ) {
    try {
      const data = await this.portalService.reservations(req.user.id, query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('reservations')
  @swagger.ApiOperation({ summary: 'Book a free room (confirmed immediately)' })
  async book(@Req() req: IRequest, @Res() res: Response, @Body() body: PortalBookDto) {
    try {
      const data = await this.portalService.book(req.user.id, body);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReservationService } from './reservation.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateReservationDto } from 'src/dto/reservation/createReservation.dto';
import { UpdateReservationDto } from 'src/dto/reservation/updateReservation.dto';
import { FetchReservationsDto } from 'src/dto/reservation/fetchReservations.dto';
import { CalendarQueryDto } from 'src/dto/reservation/calendarQuery.dto';
import { BulkMarkPaidDto } from 'src/dto/reservation/bulkMarkPaid.dto';
import { CreateReservationSeriesDto } from 'src/dto/reservation/createReservationSeries.dto';
import { AvailabilityQueryDto } from 'src/dto/reservation/availabilityQuery.dto';
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
import { IRequest } from 'src/interface/request/request.interface';

const RESERVATION_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'updatedAt', 'startAt', 'endAt', 'status'],
  defaultSort: 'startAt',
};

@swagger.ApiTags('reservation-backoffice')
@Controller('backoffice/reservation')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.CONFLICT, description: 'CONFLICT' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ReservationBackofficeController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('stats')
  @swagger.ApiOperation({ summary: 'Dashboard stats' })
  async stats(@Res() res: Response) {
    try {
      const data = await this.reservationService.dashboardStats();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('occupancy')
  @swagger.ApiOperation({ summary: 'Room × hour occupancy for a month' })
  async occupancy(
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    try {
      const y = year !== undefined ? Number(year) : undefined;
      const m = month !== undefined ? Number(month) : undefined;
      const data = await this.reservationService.occupancy(
        Number.isFinite(y) ? y : undefined,
        Number.isFinite(m) ? m : undefined,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('availability')
  @swagger.ApiOperation({ summary: 'List free rooms for a time range' })
  async availability(@Res() res: Response, @Query() query: AvailabilityQueryDto) {
    try {
      const dto = plainToInstance(AvailabilityQueryDto, query);
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
      const data = await this.reservationService.availability(
        dto.startAt,
        dto.endAt,
        dto.excludeReservationId,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('calendar')
  @swagger.ApiOperation({ summary: 'Calendar events in range' })
  async calendar(@Res() res: Response, @Query() query: CalendarQueryDto) {
    try {
      const dto = plainToInstance(CalendarQueryDto, query);
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
      const data = await this.reservationService.calendar(dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('list')
  @swagger.ApiOperation({ summary: 'List reservations (server-side filters)' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(RESERVATION_SORTING_OPTIONS)
  @ApiSearchQuery({
    fields: ['title', 'notes', 'room.name', 'professor.firstName', 'professor.lastName'],
  })
  async list(
    @Res() res: Response,
    @Req() req: IRequest,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(RESERVATION_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
    @SearchQuery({
      fields: ['title', 'notes', 'room.name', 'professor.firstName', 'professor.lastName'],
    })
    search: object,
  ) {
    try {
      // Use raw query strings so `isPaid=false` is not coerced by ValidationPipe.
      const dto = plainToInstance(FetchReservationsDto, req.query);
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

      const data = await this.reservationService.listReservations(
        dto,
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
  @swagger.ApiOperation({ summary: 'Get reservation by id' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.reservationService.getReservationById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('series')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Create a recurring reservation series' })
  async createSeries(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreateReservationSeriesDto,
  ) {
    try {
      const dto = plainToInstance(CreateReservationSeriesDto, body);
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
      const data = await this.reservationService.createReservationSeries(
        dto,
        req.user?.id,
      );
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('bulk-paid')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Mark multiple reservations as paid' })
  async bulkMarkPaid(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: BulkMarkPaidDto,
  ) {
    try {
      const dto = plainToInstance(BulkMarkPaidDto, body);
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
      const data = await this.reservationService.bulkMarkPaid(
        dto.ids,
        req.user?.id,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Create a reservation' })
  async create(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreateReservationDto,
  ) {
    try {
      const dto = plainToInstance(CreateReservationDto, body);
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
      const data = await this.reservationService.createReservation(
        dto,
        req.user?.id,
      );
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Update a reservation' })
  async update(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: UpdateReservationDto,
  ) {
    try {
      const dto = plainToInstance(UpdateReservationDto, body);
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
      const data = await this.reservationService.updateReservation(
        id,
        dto,
        req.user?.id,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/cancel')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Cancel a reservation' })
  async cancel(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.reservationService.cancelReservation(
        id,
        req.user?.id,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/delete-series-future')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({
    summary: 'Soft-delete this and future occurrences in the same series',
  })
  async deleteSeriesFuture(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.reservationService.deleteFutureInSeries(
        id,
        req.user?.id,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a reservation' })
  async remove(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      await this.reservationService.deleteReservation(id, req.user?.id);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Reservation deleted',
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

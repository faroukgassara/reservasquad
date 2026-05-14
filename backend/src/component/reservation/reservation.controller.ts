import { Body, Controller, Get, Patch, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from 'src/dto/reservation/create-reservation.dto';
import { AdminCreateReservationDto } from 'src/dto/reservation/admin-create-reservation.dto';
import { UpdateReservationDto } from 'src/dto/reservation/update-reservation.dto';
import { ListReservationsQueryDto } from 'src/dto/reservation/list-reservations-query.dto';
import { IRequest } from 'src/interface/request/request.interface';
import { Roles } from 'src/common/decorator/roles.decorator';

@ApiTags('reservations')
@ApiBearerAuth('Authorization')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('calendar')
  @ApiOperation({
    summary: 'Reservations grouped by calendar day',
    description: 'All roles see every reservation in the requested month.',
  })
  calendar(@Query('year') yearStr: string, @Query('month') monthStr: string) {
    return this.reservationService.calendar(Number(yearStr), Number(monthStr));
  }

  @Get()
  @ApiOperation({ summary: 'List reservations (admin: filters; teachers: mine=true)' })
  list(@Req() req: IRequest, @Query() query: ListReservationsQueryDto) {
    const user = { id: req.user!.id, role: req.user!.role };
    return this.reservationService.list(user, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create reservation',
    description: 'Teacher: PENDING by default; admin may force CONFIRMED via body.status.',
  })
  create(@Req() req: IRequest, @Body() dto: CreateReservationDto) {
    const user = { id: req.user!.id, role: req.user!.role };
    return this.reservationService.create(dto, user);
  }

  @Post('admin')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Create confirmed reservation on behalf of a teacher' })
  adminCreate(@Req() req: IRequest, @Body() dto: AdminCreateReservationDto) {
    const acting = { id: req.user!.id, role: req.user!.role };
    return this.reservationService.adminCreateForTeacher(dto, acting);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update reservation (admin: confirm/reject; teacher: cancel own)',
  })
  update(
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    const user = { id: req.user!.id, role: req.user!.role };
    return this.reservationService.updateReservation(id, dto, user);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { ReservationService } from './reservation.service';
import { AdminCreateReservationDto } from 'src/dto/reservation/admin-create-reservation.dto';
import { BookReservationDto } from 'src/dto/reservation/book-reservation.dto';
import { ListReservationsQueryDto } from 'src/dto/reservation/list-reservations-query.dto';
import { UpdateReservationDto } from 'src/dto/reservation/update-reservation.dto';
import { IRequest } from 'src/interface/request/request.interface';
import { Roles } from 'src/common/decorator/roles.decorator';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Public(true)
  @Get('calendar')
  @ApiOperation({
    summary: 'Monthly calendar view (public)',
    description: 'All reservations grouped by calendar day.',
  })
  calendar(@Query('year') yearStr: string, @Query('month') monthStr: string) {
    return this.reservationService.calendar(Number(yearStr), Number(monthStr));
  }

  @Public(true)
  @Post('book')
  @ApiOperation({
    summary: 'Anonymous booking — always PENDING',
    description:
      'Links the reservation to a teacher profile chosen from the dropdown. Requires admin acceptance.',
  })
  book(@Body() dto: BookReservationDto) {
    return this.reservationService.createPublicBooking(dto);
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'List reservations (admin only)', description: 'Filter by room, status, date.' })
  list(@Query() query: ListReservationsQueryDto) {
    return this.reservationService.list(query);
  }

  @Post('admin')
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Create confirmed reservation for a teacher' })
  adminCreate(@Req() req: IRequest, @Body() dto: AdminCreateReservationDto) {
    const acting = { id: req.user!.id, role: req.user!.role };
    return this.reservationService.adminCreateForTeacher(dto, acting);
  }

  @Patch(':id')
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({
    summary: 'Update reservation status (approve / refuse / cancel)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationService.updateReservation(id, dto);
  }
}

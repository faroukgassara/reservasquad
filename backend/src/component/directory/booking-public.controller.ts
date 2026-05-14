import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { TeachersService } from './teachers.service';

@ApiTags('public')
@Controller('public')
export class BookingPublicController {
  constructor(private readonly teachers: TeachersService) {}

  @Public(true)
  @Get('teachers')
  @ApiOperation({
    summary: 'Teacher list for anonymous booking',
    description: 'Minimal list (id + display name) for dropdowns on the public calendar.',
  })
  listTeachers() {
    return this.teachers.listForPublicBooking();
  }
}

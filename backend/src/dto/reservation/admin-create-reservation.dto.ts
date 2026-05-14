import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateReservationDto } from './create-reservation.dto';

export class AdminCreateReservationDto extends CreateReservationDto {
  @ApiProperty({ description: 'Teacher user id — reservation is CONFIRMED immediately' })
  @IsString()
  teacherUserId: string;
}

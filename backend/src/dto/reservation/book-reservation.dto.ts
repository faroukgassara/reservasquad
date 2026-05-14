import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Matches, Max, Min, MinLength } from 'class-validator';

export class BookReservationDto {
  @ApiProperty({ description: 'Teacher id (managed by admin)' })
  @IsString()
  @MinLength(1)
  teacherUserId: string;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty({ description: 'Day of the reservation (YYYY-MM-DD or ISO)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty({ example: '11:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  numberOfPeople: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  purpose: string;
}

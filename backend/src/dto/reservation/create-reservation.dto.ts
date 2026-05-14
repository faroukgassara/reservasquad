import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ReservationStatus } from 'src/generated/prisma/client';

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty({ description: 'Reservation day (ISO date)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^\d{2}:\d{2}$/)
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Use 00:00 for midnight end', example: '12:00' })
  @Matches(/^\d{2}:\d{2}$/)
  @IsString()
  endTime: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  numberOfPeople: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  purpose: string;

  @ApiPropertyOptional({ enum: ReservationStatus, description: 'ADMIN only — immediate CONFIRMED' })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}

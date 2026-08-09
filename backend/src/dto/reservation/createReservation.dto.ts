import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EReservationStatus } from 'src/generated/prisma/client';

export class CreateReservationDto {
  @ApiPropertyOptional({ example: 'Cours de maths' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiProperty({ example: '2026-08-10T09:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-08-10T11:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ enum: EReservationStatus, default: EReservationStatus.CONFIRMED })
  @IsOptional()
  @IsEnum(EReservationStatus)
  status?: EReservationStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ReservationStatus } from 'src/generated/prisma/client';

export class UpdateReservationDto {
  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ description: 'Marquer la réservation comme payée (admin uniquement)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  paid?: boolean;
}

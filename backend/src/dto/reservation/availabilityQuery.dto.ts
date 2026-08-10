import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-08-10T09:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-08-10T11:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: 'Exclude this reservation from overlap checks (e.g. when swapping rooms)',
  })
  @IsOptional()
  @IsUUID()
  excludeReservationId?: string;
}

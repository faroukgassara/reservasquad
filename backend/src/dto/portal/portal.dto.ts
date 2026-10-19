import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PortalRangeDto {
  @ApiProperty({ example: '2026-11-03T09:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-11-03T11:00:00.000Z' })
  @IsDateString()
  endAt: string;
}

export class PortalScheduleDto {
  @ApiProperty({ example: '2026-11-03T00:00:00.000Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-11-04T00:00:00.000Z' })
  @IsDateString()
  to: string;
}

export class PortalBookDto extends PortalRangeDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiPropertyOptional({ example: 'Cours de maths' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export const PORTAL_RESERVATION_SCOPES = ['upcoming', 'past', 'all'] as const;
export type PortalReservationScope = (typeof PORTAL_RESERVATION_SCOPES)[number];

export class FetchPortalReservationsDto {
  @ApiPropertyOptional({ enum: PORTAL_RESERVATION_SCOPES, default: 'all' })
  @IsOptional()
  @IsIn(PORTAL_RESERVATION_SCOPES)
  scope?: PortalReservationScope = 'all';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  perPage?: number = 10;
}

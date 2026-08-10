import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { EReservationStatus } from 'src/generated/prisma/client';

/** Keep as string so ValidationPipe boolean conversion cannot turn "false" into true. */
function toOptionalPaidFlag(value: unknown): 'true' | 'false' | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1' || value === 1) return 'true';
  if (value === false || value === 'false' || value === '0' || value === 0) return 'false';
  return undefined;
}

export class FetchReservationsDto {
  @ApiPropertyOptional({ enum: EReservationStatus })
  @IsOptional()
  @IsEnum(EReservationStatus)
  status?: EReservationStatus;

  @ApiPropertyOptional({ description: 'Filter by room id' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter by professor id' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status (`true` | `false` as query string)',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @Transform(({ value }) => toOptionalPaidFlag(value))
  @IsIn(['true', 'false'])
  isPaid?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Inclusive lower bound for reservation start (ISO date/time)',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Exclusive upper bound for reservation start (ISO date/time)',
    example: '2026-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

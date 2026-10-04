import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UnpaidSummaryQueryDto {
  @ApiPropertyOptional({ description: 'Professor UUID, or "none" for reservations without professor' })
  @IsOptional()
  @IsString()
  professorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Exclusive upper bound on startAt', example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

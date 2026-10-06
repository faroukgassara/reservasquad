import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ProfessorRankingQueryDto {
  @ApiPropertyOptional({ description: 'Inclusive lower bound on startAt', example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Exclusive upper bound on startAt', example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

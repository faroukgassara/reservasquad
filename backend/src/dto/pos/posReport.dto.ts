import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class SalesDetailsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-06T22:38:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-07T11:51:29.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Report a single session instead of a period' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

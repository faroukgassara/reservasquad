import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const DAILY_INCOME_SCOPES = ['month', 'all'] as const;
export type DailyIncomeScope = (typeof DAILY_INCOME_SCOPES)[number];

export class FetchDailyIncomeDto {
  @ApiPropertyOptional({ enum: DAILY_INCOME_SCOPES, default: 'month' })
  @IsOptional()
  @IsIn(DAILY_INCOME_SCOPES)
  scope?: DailyIncomeScope;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

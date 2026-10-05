import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EIncomeLineType } from 'src/generated/prisma/client';
import { DAILY_INCOME_SCOPES, type DailyIncomeScope } from './fetchDailyIncome.dto';

export class FetchIncomeLinesDto {
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

  @ApiPropertyOptional({ enum: EIncomeLineType })
  @IsOptional()
  @IsEnum(EIncomeLineType)
  type?: EIncomeLineType;
}

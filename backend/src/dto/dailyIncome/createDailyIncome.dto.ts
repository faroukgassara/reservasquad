import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyIncomeDto {
  @ApiProperty({ example: '2026-08-09' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 150.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalIncome: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

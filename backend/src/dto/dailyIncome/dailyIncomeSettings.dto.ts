import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDailyIncomeSettingsDto {
  @ApiProperty({ example: 50, description: 'Charges & investments percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  chargesPercentage: number;

  @ApiProperty({ example: 20, description: 'Savings percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  savingsPercentage: number;

  @ApiProperty({ example: 20, description: 'Benefits percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  benefitsPercentage: number;

  @ApiProperty({ example: 10, description: 'Saving for charges percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  savingsForChargesPercentage: number;
}

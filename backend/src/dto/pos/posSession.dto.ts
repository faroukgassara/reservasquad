import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class OpenPosSessionDto {
  @ApiPropertyOptional({ example: 199.1, description: 'Only used when the settings allow the cashier to override the amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  openingCash?: number;
}

export class UpdatePosSettingsDto {
  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  defaultOpeningCash: number;

  @ApiProperty({ default: false, description: 'Let the cashier change the amount when opening a session' })
  @Type(() => Boolean)
  @IsBoolean()
  allowCashierOverride: boolean;

  @ApiProperty({ default: false, description: 'Synchronize POS session revenue with daily income on close' })
  @Type(() => Boolean)
  @IsBoolean()
  syncDailyIncome: boolean;
}

export class ClosePosSessionDto {
  @ApiProperty({ example: 71.6 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  countedCash: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
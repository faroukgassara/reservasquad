import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EIncomeLineType } from 'src/generated/prisma/client';

export class CreateIncomeLineDto {
  @ApiProperty({ example: '2026-08-09' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ enum: EIncomeLineType })
  @IsEnum(EIncomeLineType)
  type: EIncomeLineType;

  @ApiProperty({ example: 'Eau' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}

export class UpdateIncomeLineDto {
  @ApiPropertyOptional({ example: '2026-08-09' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: EIncomeLineType })
  @IsOptional()
  @IsEnum(EIncomeLineType)
  type?: EIncomeLineType;

  @ApiPropertyOptional({ example: 'Eau' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}

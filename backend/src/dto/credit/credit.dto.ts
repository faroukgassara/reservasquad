import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCreditDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: '2026-10-05' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Café + impression' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateCreditDto {
  @ApiPropertyOptional({ example: '2026-10-05' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: 'Café + impression' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateCreditPaymentDto {
  @ApiProperty({ example: '2026-10-07' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Espèces' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

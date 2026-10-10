import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateCreditDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: '2026-10-05' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 25, description: 'Required without a product; computed from the product otherwise' })
  @ValidateIf((dto: CreateCreditDto) => !dto.productId)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Product taken on credit; its stock is decreased' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 2 })
  @ValidateIf((dto: CreateCreditDto) => !!dto.productId)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(10000)
  quantity?: number;

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

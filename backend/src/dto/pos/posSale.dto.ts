import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ESaleOrderStatus } from 'src/generated/prisma/client';
import { POS_TAX_RATES } from './posCatalog.dto';

export class DocumentLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  productId?: string | null;

  @ApiProperty({ example: 'Abonnement 14 J journée complet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(100000)
  quantity: number;

  @ApiProperty({ example: 48 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPct?: number;

  @ApiPropertyOptional({ enum: POS_TAX_RATES, example: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(POS_TAX_RATES)
  taxRate?: number;
}

export class SaveSaleOrderDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ example: '2026-11-07' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @ApiProperty({ type: [DocumentLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines: DocumentLineDto[];
}

export class FetchSaleOrdersDto {
  @ApiPropertyOptional({ enum: ESaleOrderStatus })
  @IsOptional()
  @IsEnum(ESaleOrderStatus)
  status?: ESaleOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: ['true'], description: 'Confirmed orders with an amount still due' })
  @IsOptional()
  @IsIn(['true'])
  payable?: string;

  @ApiPropertyOptional({ description: 'Order number or client name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

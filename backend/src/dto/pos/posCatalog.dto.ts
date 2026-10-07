import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
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
import { EPosProductType, ESubscriptionUnit } from 'src/generated/prisma/client';

export const POS_TAX_RATES = [0, 7, 19];

export class CreatePosCategoryDto {
  @ApiProperty({ example: 'Buvette' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Image URL or base64 data URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePosCategoryDto {
  @ApiPropertyOptional({ example: 'Buvette' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Image URL or base64 data URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreatePosProductDto {
  @ApiProperty({ example: 'Café American' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'Image URL or base64 data URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiProperty({ example: 1.7 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 0.76 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ enum: EPosProductType })
  @IsOptional()
  @IsEnum(EPosProductType)
  type?: EPosProductType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  availableInPos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string | null;

  @ApiPropertyOptional({ enum: POS_TAX_RATES, example: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(POS_TAX_RATES)
  taxRate?: number;

  @ApiPropertyOptional({ example: 1, description: 'Set with subscriptionUnit to make this a subscription product' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  subscriptionDuration?: number | null;

  @ApiPropertyOptional({ enum: ESubscriptionUnit })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(ESubscriptionUnit)
  subscriptionUnit?: ESubscriptionUnit | null;
}

export class UpdatePosProductDto {
  @ApiPropertyOptional({ example: 'Café American' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'Image URL or base64 data URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 1.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 0.76 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ enum: EPosProductType })
  @IsOptional()
  @IsEnum(EPosProductType)
  type?: EPosProductType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  availableInPos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string | null;

  @ApiPropertyOptional({ enum: POS_TAX_RATES, example: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(POS_TAX_RATES)
  taxRate?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  subscriptionDuration?: number | null;

  @ApiPropertyOptional({ enum: ESubscriptionUnit })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(ESubscriptionUnit)
  subscriptionUnit?: ESubscriptionUnit | null;
}

export class FetchPosProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @Transform(({ obj, key }) => {
    const raw = (obj as Record<string, unknown>)[key];
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return raw;
  })
  @IsBoolean()
  availableInPos?: boolean;

  @ApiPropertyOptional({ enum: ['true'], description: 'Only subscription products' })
  @IsOptional()
  @IsIn(['true'])
  subscription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreatePosStockEntryDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 0.76 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Sorimex' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

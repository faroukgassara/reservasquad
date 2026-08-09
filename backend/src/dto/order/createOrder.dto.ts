import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EShippingMethod } from 'src/generated/prisma/client';

export class CreateOrderLineDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @MinLength(1)
  productTitle!: string;

  @IsString()
  @MinLength(1)
  productSlug!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  engraving?: string;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  phone!: string;

  @IsString()
  @MinLength(3)
  address!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  governorate!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsEnum(EShippingMethod)
  shippingMethod!: EShippingMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines!: CreateOrderLineDto[];
}

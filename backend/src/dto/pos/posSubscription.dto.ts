import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EDiscountType, ESubscriptionStatus } from 'src/generated/prisma/client';

export const SUBSCRIPTION_STATES = ['running', 'expiring', 'expired'] as const;
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

export class SaveSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Product with a subscription duration' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: '2026-10-07' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: 120, description: 'Defaults to the product price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPct?: number;

  @ApiPropertyOptional({ enum: EDiscountType, default: EDiscountType.PERCENT })
  @IsOptional()
  @IsEnum(EDiscountType)
  discountType?: EDiscountType;

  @ApiPropertyOptional({ example: 0, description: 'Fixed discount, used when discountType is AMOUNT' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}

export class RenewSubscriptionDto {
  @ApiProperty({ example: '2026-11-07', description: 'Start of the new period' })
  @IsDateString()
  startDate: string;
}

export class FetchSubscriptionsDto {
  @ApiPropertyOptional({ enum: ESubscriptionStatus })
  @IsOptional()
  @IsEnum(ESubscriptionStatus)
  status?: ESubscriptionStatus;

  @ApiPropertyOptional({
    enum: SUBSCRIPTION_STATES,
    description: 'Active subscriptions by period: running (not ended), expiring (ends within 7 days), expired',
  })
  @IsOptional()
  @IsIn(SUBSCRIPTION_STATES)
  state?: SubscriptionState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: ['true'], description: 'Draft or active subscriptions with an amount still due' })
  @IsOptional()
  @IsIn(['true'])
  payable?: string;

  @ApiPropertyOptional({ description: 'Subscription number, client or product name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

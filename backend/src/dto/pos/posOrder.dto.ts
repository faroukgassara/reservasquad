import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  NotEquals,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EPosOrderStatus, EPosPaymentMethod } from 'src/generated/prisma/client';

export class CreatePosOrderLineDto {
  @ApiPropertyOptional({ description: 'Required unless the line settles a sale order, a subscription or a client credit' })
  @ValidateIf(
    (line: CreatePosOrderLineDto) =>
      !line.saleOrderId && !line.subscriptionId && !line.creditId && !line.invoiceId,
  )
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Settlement or deposit for a posted invoice' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Payment of what remains on a client credit' })
  @IsOptional()
  @IsUUID()
  creditId?: string;

  @ApiPropertyOptional({ description: 'Settlement or deposit for a confirmed sale order' })
  @IsOptional()
  @IsUUID()
  saleOrderId?: string;

  @ApiPropertyOptional({ description: 'Settlement or deposit for a draft or active subscription' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Deposit line: the rest of the document is added to the client credit account' })
  @IsOptional()
  @IsBoolean()
  creditRemainder?: boolean;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @NotEquals(0)
  @Min(-10000)
  @Max(10000)
  quantity: number;

  @ApiProperty({ example: 1.7 })
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
}

export class CreatePosPaymentDto {
  @ApiProperty({ enum: EPosPaymentMethod })
  @IsEnum(EPosPaymentMethod)
  method: EPosPaymentMethod;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  amount: number;
}

export class CreatePosOrderDto {
  @ApiProperty({ type: [CreatePosOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreatePosOrderLineDto)
  lines: CreatePosOrderLineDto[];

  @ApiProperty({ type: [CreatePosPaymentDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreatePosPaymentDto)
  payments: CreatePosPaymentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  creditClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class RefundPosOrderLineDto {
  @ApiProperty()
  @IsUUID()
  lineId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;
}

export class RefundPosOrderDto {
  @ApiProperty({ type: [RefundPosOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => RefundPosOrderLineDto)
  lines: RefundPosOrderLineDto[];

  @ApiProperty({ enum: [EPosPaymentMethod.CASH, EPosPaymentMethod.BANK] })
  @IsIn([EPosPaymentMethod.CASH, EPosPaymentMethod.BANK])
  method: EPosPaymentMethod;
}

export class FetchPosOrdersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  creditClientId?: string;

  @ApiPropertyOptional({ enum: EPosOrderStatus })
  @IsOptional()
  @IsEnum(EPosOrderStatus)
  status?: EPosOrderStatus;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Exclusive upper bound' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Order number or client name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

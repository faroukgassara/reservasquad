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
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EInvoiceStatus, EInvoiceType } from 'src/generated/prisma/client';
import { DocumentLineDto } from './posSale.dto';

export const INVOICE_PAYMENT_STATES = ['NOT_PAID', 'PARTIAL', 'PAID'] as const;
export type InvoicePaymentState = (typeof INVOICE_PAYMENT_STATES)[number];

export class SaveInvoiceDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: '2026-10-07' })
  @IsDateString()
  invoiceDate: string;

  @ApiPropertyOptional({ example: '2026-10-07' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @ApiPropertyOptional({ example: true, description: 'Add the timbre fiscal from the settings' })
  @IsOptional()
  @IsBoolean()
  withStampDuty?: boolean;

  @ApiProperty({ type: [DocumentLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines: DocumentLineDto[];
}

export class FetchInvoicesDto {
  @ApiPropertyOptional({ enum: EInvoiceType })
  @IsOptional()
  @IsEnum(EInvoiceType)
  type?: EInvoiceType;

  @ApiPropertyOptional({ enum: EInvoiceStatus })
  @IsOptional()
  @IsEnum(EInvoiceStatus)
  status?: EInvoiceStatus;

  @ApiPropertyOptional({ enum: INVOICE_PAYMENT_STATES })
  @IsOptional()
  @IsIn(INVOICE_PAYMENT_STATES)
  paymentState?: InvoicePaymentState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Only posted invoices with an amount due', enum: ['true'] })
  @IsOptional()
  @IsIn(['true'])
  payable?: 'true';

  @ApiPropertyOptional({ description: 'Client name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
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

  @ApiPropertyOptional({ example: 'Facture août' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Required when type is CHARGE',
  })
  @ValidateIf((o: CreateIncomeLineDto) => o.type === EIncomeLineType.CHARGE)
  @IsUUID()
  @IsNotEmpty()
  categoryId?: string;

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

  @ApiPropertyOptional({ example: 'Facture août', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: 'uuid',
    nullable: true,
    description: 'Required when the resulting type is CHARGE',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}

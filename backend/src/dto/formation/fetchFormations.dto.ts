import { ApiPropertyOptional } from '@nestjs/swagger';
import { EStatus } from 'src/generated/prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FetchFormationsDto {
    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: EStatus,
    })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({
        description: 'Filter by category ID',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Minimum price' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    priceMin?: number;

    @ApiPropertyOptional({ description: 'Maximum price' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    priceMax?: number;

    @ApiPropertyOptional({ description: 'Minimum duration (hours)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    durationMin?: number;

    @ApiPropertyOptional({ description: 'Maximum duration (hours)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    durationMax?: number;
}

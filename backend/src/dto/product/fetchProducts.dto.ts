import { ApiPropertyOptional } from '@nestjs/swagger';
import { EStatus } from 'src/generated/prisma/client';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

function toStringArray(value: unknown): string[] | undefined {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) {
        return value.map(String).map((v) => v.trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
    }
    return [String(value)];
}

export class FetchProductsDto {
    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: EStatus,
    })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({
        description: 'Filter by a single category ID',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Filter by one or more category IDs',
        type: [String],
        isArray: true,
    })
    @IsOptional()
    @Transform(({ value }) => toStringArray(value))
    @IsArray()
    @IsString({ each: true })
    categoryIds?: string[];

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

    @ApiPropertyOptional({
        description: 'Filter by featured flag',
        example: true,
    })
    @IsOptional()
    @Transform(({ obj }) => {
        // Read raw query value — enableImplicitConversion turns "false" into true via Boolean("false")
        const value = obj.featured as unknown;
        if (value === true || value === 'true' || value === '1') return true;
        if (value === false || value === 'false' || value === '0') return false;
        return undefined;
    })
    @IsBoolean()
    featured?: boolean;
}

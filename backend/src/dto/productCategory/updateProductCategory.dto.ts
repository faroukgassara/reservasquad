import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { EStatus } from 'src/generated/prisma/client';

export class UpdateProductCategoryDto {
    @ApiPropertyOptional({
        description: 'Category name',
        example: 'Accessories',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'URL-friendly slug',
        example: 'accessories',
    })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({
        description: 'Category description',
        example: 'Office and coworking accessories',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Sort order for display',
        example: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({
        description: 'Category status',
        enum: EStatus,
    })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;
}

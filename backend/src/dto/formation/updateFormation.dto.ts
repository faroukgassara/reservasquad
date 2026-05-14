import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsInt,
    Min,
    IsNumber,
    IsEnum,
} from 'class-validator';
import { EStatus } from 'src/generated/prisma/client';

export class UpdateFormationDto {
    @ApiPropertyOptional({
        description: 'Formation title',
        example: 'Développement Web Full Stack',
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({
        description: 'Formation description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Duration in hours',
        example: 120,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number;

    @ApiPropertyOptional({
        description: 'Price',
        example: 1500.5,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({
        description: 'Image URL',
    })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({
        description: 'URL-friendly slug',
        example: 'developpement-web-full-stack',
    })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({
        description: 'Formation status',
        enum: EStatus,
    })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({
        description: 'Category ID',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateFormationCategoryDto {
    @ApiPropertyOptional({
        description: 'Category name',
        example: 'Informatique',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Category specifications',
        example: ['Spec 1', 'Spec 2'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specifications?: string[];

    @ApiPropertyOptional({
        description: 'URL-friendly slug',
        example: 'informatique',
    })
    @IsOptional()
    @IsString()
    slug?: string;
}

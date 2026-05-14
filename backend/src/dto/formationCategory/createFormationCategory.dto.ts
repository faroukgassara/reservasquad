import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateFormationCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Informatique',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Category specifications',
        example: ['Spec 1', 'Spec 2'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specifications?: string[];

    @ApiProperty({
        description: 'URL-friendly slug',
        example: 'informatique',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;
}

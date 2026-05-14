import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsInt,
    Min,
    IsNumber,
    IsEnum,
} from 'class-validator';
import { EStatus } from 'src/generated/prisma/client';

export class CreateFormationDto {
    @ApiProperty({
        description: 'Formation title',
        example: 'Développement Web Full Stack',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Formation description',
        example: 'Formation complète en développement web...',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: 'Duration in hours',
        example: 120,
    })
    @IsInt()
    @Min(1)
    duration: number;

    @ApiProperty({
        description: 'Price',
        example: 1500.5,
    })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({
        description: 'Image URL',
        example: 'https://example.com/formation.jpg',
    })
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @ApiProperty({
        description: 'URL-friendly slug',
        example: 'developpement-web-full-stack',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({
        description: 'Formation status',
        enum: EStatus,
    })
    @IsEnum(EStatus)
    @IsNotEmpty()
    status: EStatus;

    @ApiProperty({
        description: 'Category ID',
        example: 'uuid-here',
    })
    @IsString()
    @IsNotEmpty()
    categoryId: string;
}

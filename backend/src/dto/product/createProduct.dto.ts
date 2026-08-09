import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    IsBoolean, Min
} from 'class-validator';
import { EStatus } from 'src/generated/prisma/client';

export class CreateProductDto {
    @ApiProperty({
        description: 'Product title',
        example: 'Ergonomic Desk Lamp',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({
        description: 'Full product description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Base price (TND)',
        example: 149,
    })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({
        description: 'Price after discount (TND). When set, this is the selling price.',
        example: 129,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountedPrice?: number;

    @ApiPropertyOptional({
        description: 'Primary image URL or base64 (kept for compatibility)',
    })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({
        description: 'Product gallery images (URLs or base64 data URLs)',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({
        description: 'URL-friendly slug',
        example: 'ergonomic-desk-lamp',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiPropertyOptional({
        description: 'Dynamic product badges',
        example: ['Nouveau', 'Personnalisable'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    badges?: string[];

    @ApiPropertyOptional({
        description: 'Available material options',
        example: ['Bois clair', 'Bois foncé'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    materials?: string[];

    @ApiPropertyOptional({
        description: 'Available size options',
        example: ['Petite (20 cm)', 'Moyenne (30 cm)'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];

    @ApiPropertyOptional({
        description: 'Whether engraving text can be provided by the customer',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    hasEngraving?: boolean;

    @ApiPropertyOptional({
        description: 'Whether the product is featured',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    featured?: boolean;

    @ApiProperty({
        description: 'Product status',
        enum: EStatus,
    })
    @IsEnum(EStatus)
    @IsNotEmpty()
    status: EStatus;

    @ApiPropertyOptional({
        description: 'Category ID',
        example: 'uuid-here',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;
}

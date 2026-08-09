import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    IsBoolean, Min
} from 'class-validator';
import { EStatus } from 'src/generated/prisma/client';

export class UpdateProductDto {
    @ApiPropertyOptional({ description: 'Product title' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'Full product description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Base price (TND)', example: 149 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({
        description: 'Price after discount (TND)',
        example: 129,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountedPrice?: number | null;

    @ApiPropertyOptional({ description: 'Primary image URL or base64' })
    @IsOptional()
    @IsString()
    imageUrl?: string | null;

    @ApiPropertyOptional({
        description: 'Product gallery images',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({ description: 'URL-friendly slug' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({
        description: 'Dynamic product badges',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    badges?: string[];

    @ApiPropertyOptional({
        description: 'Available material options',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    materials?: string[];

    @ApiPropertyOptional({
        description: 'Available size options',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];

    @ApiPropertyOptional({
        description: 'Whether engraving text can be provided by the customer',
    })
    @IsOptional()
    @IsBoolean()
    hasEngraving?: boolean;

    @ApiPropertyOptional({ description: 'Whether the product is featured' })
    @IsOptional()
    @IsBoolean()
    featured?: boolean;

    @ApiPropertyOptional({ description: 'Product status', enum: EStatus })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({ description: 'Category ID' })
    @IsOptional()
    @IsString()
    categoryId?: string | null;
}

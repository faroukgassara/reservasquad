import { EStatus } from 'src/generated/prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateBlogDto {
    @IsString()
    @MinLength(1)
    title!: string;

    @IsOptional()
    @IsString()
    excerpt?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string | null;

    @IsString()
    @MinLength(1)
    slug!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @ValidateIf((_, v) => v != null && v !== '')
    @IsDateString()
    publishedAt?: string | null;

    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;
}

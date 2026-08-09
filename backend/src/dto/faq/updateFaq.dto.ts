import { EStatus } from 'src/generated/prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class UpdateFaqDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    question?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    answer?: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;
}

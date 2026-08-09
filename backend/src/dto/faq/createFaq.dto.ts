import { EStatus } from 'src/generated/prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateFaqDto {
    @IsString()
    @MinLength(1)
    question!: string;

    @IsString()
    @MinLength(1)
    answer!: string;

    @IsUUID()
    categoryId!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;
}

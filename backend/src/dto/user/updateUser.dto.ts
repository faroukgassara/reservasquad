import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ERole, EStatus } from 'src/generated/prisma/client';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Jane' })
    @IsOptional()
    @IsString()
    @Length(3, 255)
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsOptional()
    @IsString()
    @Length(3, 255)
    lastName?: string;

    @ApiPropertyOptional({ example: '+21612345678' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: ERole })
    @IsOptional()
    @IsEnum(ERole)
    role?: ERole;

    @ApiPropertyOptional({ enum: EStatus })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({ description: 'New password (optional on update)' })
    @IsOptional()
    @IsString()
    @Length(6, 255)
    password?: string;
}

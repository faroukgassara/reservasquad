import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthTokensDto } from './authTokens.dto';
import { ERole } from 'src/generated/prisma/client';

export class AuthResponseDto extends AuthTokensDto {
    @ApiProperty({
        description: 'Authenticated user identifier',
        example: '3e4f8a6f-7b1d-4d4f-8f6f-d81fd6f5b8f4',
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+21612345678',
    })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description: "User's email address",
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User status',
        example: 'ACTIVE',
    })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({
        description: 'Profile image URL',
        example: 'https://cdn.example.com/avatar.png',
    })
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @ApiProperty({
        description: 'User role',
        example: 'ADMIN',
        enum: ERole,
    })
    @IsEnum(ERole)
    role: ERole;

    @ApiPropertyOptional({
        description: 'Current token version for invalidation checks',
        example: 2,
    })
    tokenVersion?: number;

    @ApiProperty({
        description: 'User creation timestamp',
        example: '2026-02-24T10:00:00.000Z',
    })
    @IsDateString()
    createdAt: Date;

    @ApiProperty({
        description: 'User update timestamp',
        example: '2026-02-24T10:10:00.000Z',
    })
    @IsDateString()
    updatedAt: Date;

    @ApiPropertyOptional({
        description: 'Archived timestamp',
        example: '2026-02-24T11:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    archivedAt?: Date | null;

    @ApiPropertyOptional({
        description: 'Soft deletion timestamp',
        example: '2026-02-24T11:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    deletedAt?: Date | null;
}

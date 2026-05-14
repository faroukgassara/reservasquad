import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, Min } from 'class-validator';

export class AuthTokensDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    access_token: string;

    @ApiProperty({
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    refresh_token: string;

    @ApiProperty({
        description: 'Whether login is persistent',
        example: true,
    })
    @IsBoolean()
    rememberMe: boolean;

    @ApiProperty({
        description: 'Access token expiry in seconds',
        example: 900,
    })
    @IsInt()
    @Min(0)
    expires_in: number;

    @ApiProperty({
        description: 'Refresh token expiry in seconds',
        example: 2592000,
    })
    @IsInt()
    @Min(0)
    refresh_expires_in: number;
}

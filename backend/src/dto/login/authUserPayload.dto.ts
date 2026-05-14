import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AuthUserPayloadDto {
    @ApiProperty({
        description: 'Authenticated user identifier',
        example: '3e4f8a6f-7b1d-4d4f-8f6f-d81fd6f5b8f4',
    })
    @IsString()
    id: string;

    @ApiPropertyOptional({
        description: 'Whether user opted for a persistent session',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;

    @ApiPropertyOptional({
        description: 'Token version used to invalidate old tokens',
        example: 1,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    tokenVersion?: number;
}

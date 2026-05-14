import { IsJWT, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset JWT token sent by email',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsNotEmpty()
    @IsJWT()
    token: string;

    @ApiProperty({
        description: 'New password chosen by the user',
        example: 'NewSecurePassword123!',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
    })
    newPassword: string;
}

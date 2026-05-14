import { IsJWT, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateResetPasswordTokenDto {
    @ApiProperty({
        description: 'Password reset JWT token to validate',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsNotEmpty()
    @IsJWT()
    token: string;
}

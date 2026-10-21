import { IsJWT, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/constants/password-rules.constant';

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
    @IsStrongPassword()
    newPassword: string;
}

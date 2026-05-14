import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailTransform } from 'src/common/decorator/email-transform.decorator';

export class RequestResetPasswordDto {
    @ApiProperty({
        description: "User's email address for password reset",
        example: 'user@example.com',
    })
    @EmailTransform()
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

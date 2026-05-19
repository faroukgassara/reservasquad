import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailTransform } from 'src/common/decorator/email-transform.decorator';

export class LoginDTO {
    @ApiProperty({
        description: "User's email address",
        example: 'user@example.com',
    })
    @EmailTransform()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: "User's password",
        example: 'MySecurePassword123!',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

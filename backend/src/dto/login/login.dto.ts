import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

    @ApiPropertyOptional({
        description: 'Whether the login should persist longer',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}

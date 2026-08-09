import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { EmailTransform } from 'src/common/decorator/email-transform.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  lastName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @EmailTransform()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+21612345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[+\d][\d\s-]{6,20}$/, {
    message: 'Phone number is invalid',
  })
  phone: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 255)
  password: string;
}

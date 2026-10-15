import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendTestNewsletterDto {
  @ApiProperty({ example: 'admin@bibliosquad.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

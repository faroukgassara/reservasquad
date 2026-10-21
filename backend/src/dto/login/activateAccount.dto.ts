import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from 'src/common/constants/password-rules.constant';

export class ActivateAccountDto {
  @ApiProperty({ description: 'Email activation token from the confirmation link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ description: 'Password chosen by an invited user' })
  @IsStrongPassword({ optional: true })
  password?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({ description: 'Email activation token from the confirmation link' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

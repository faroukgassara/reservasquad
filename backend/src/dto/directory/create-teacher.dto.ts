import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description:
      'Unique email for this teacher profile (no password = no login — booking only).',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiProperty({
    description: 'Contact phone (optional).',
    required: false,
    example: '+33 6 12 34 56 78',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

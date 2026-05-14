import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  Length,
} from 'class-validator';
import { EmailTransform } from 'src/common/decorator/email-transform.decorator';
import { ERole } from 'src/generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: "User's email address",
    example: 'jane.doe@example.com',
  })
  @EmailTransform()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: "User's first name",
    example: 'Jane',
  })
  @IsString()
  @Length(3, 255)
  firstName: string;

  @ApiPropertyOptional({
    description: "User's family name",
    example: 'Doe',
  })
  @IsString()
  @Length(3, 255)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+21612345678',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: "User's password",
    example: 'strongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'USER',
    enum: ERole,
  })
  @IsEnum(ERole)
  @IsNotEmpty()
  role: ERole;

  @ApiPropertyOptional({
    description: 'The status of the user',
    example: 'ACTIVE',
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'The image URL of the user',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

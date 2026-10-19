import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SetProfessorPasswordDto {
  @ApiProperty({ description: 'New portal password for the professor', example: 'NewSecurePassword123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(120)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  newPassword: string;
}

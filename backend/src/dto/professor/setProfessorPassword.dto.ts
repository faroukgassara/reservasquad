import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/constants/password-rules.constant';

export class SetProfessorPasswordDto {
  @ApiProperty({ description: 'New portal password for the professor', example: 'NewSecurePassword123!' })
  @IsStrongPassword()
  newPassword: string;
}

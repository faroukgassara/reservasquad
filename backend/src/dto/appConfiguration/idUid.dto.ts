import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdUidDto {
  @ApiProperty({
    description: "Unique identifier in UUID format",
    example: '9a5b9f42-87e1-4f8f-9a9e-354f2b3e59e5',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

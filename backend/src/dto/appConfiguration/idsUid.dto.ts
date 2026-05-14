import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdsUidDto {
  @ApiProperty({
    description: 'List of UUIDs to delete',
    example: '9a5b9f42-87e1-4f8f-9a9e-354f2b3e59e5',
  })
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  ids: string[];
}
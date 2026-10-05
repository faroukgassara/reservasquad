import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCreditClientDto {
  @ApiProperty({ example: 'Amine' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Ben Salah' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+21655123456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateCreditClientDto extends PartialType(CreateCreditClientDto) {}

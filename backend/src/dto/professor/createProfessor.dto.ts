import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({ example: 'Amine' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ben Salah' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'amine@bibliosquad.tn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+21655123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Mathématiques' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Optional flat reservation price in TND when this professor is assigned',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  specialPrice?: number | null;
}

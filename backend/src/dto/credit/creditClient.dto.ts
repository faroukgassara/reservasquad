import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: 'client@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'Route Mahdia km 5.5, Sfax' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: '011543N/D/M/000' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: '01234567', description: 'Tunisian national ID (8 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{8})?$/, { message: 'CIN must contain exactly 8 digits' })
  cin?: string;
}

export class UpdateCreditClientDto extends PartialType(CreateCreditClientDto) {}

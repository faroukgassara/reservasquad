import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChargeCategoryDto {
  @ApiProperty({ example: 'Eau' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

export class UpdateChargeCategoryDto {
  @ApiPropertyOptional({ example: 'Électricité' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name?: string;
}

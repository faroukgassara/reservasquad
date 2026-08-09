import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Salle Alpha' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 25.5, description: 'Price per hour in TND' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @ApiPropertyOptional({ description: 'Image URL or base64 data URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

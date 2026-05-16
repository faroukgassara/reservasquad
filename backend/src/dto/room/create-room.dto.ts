import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Salle D' })
  @IsString()
  name: string;

  @ApiProperty({ minimum: 1, maximum: 200 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  capacity: number;

  @ApiProperty({ description: 'CSS hex color for badges', example: '#a855f7' })
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'color must be a #RRGGBB hex value' })
  color: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'TND per reserved hour', minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999_999)
  pricePerHour?: number;

  @ApiProperty({ type: [String], example: ['projector', 'whiteboard'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  equipment: string[];
}

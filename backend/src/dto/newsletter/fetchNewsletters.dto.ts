import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ENewsletterAudience,
  ENewsletterCategory,
  ENewsletterStatus,
} from 'src/generated/prisma/client';

export class FetchNewslettersDto {
  @ApiPropertyOptional({ example: 'promo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ENewsletterCategory })
  @IsOptional()
  @IsEnum(ENewsletterCategory)
  category?: ENewsletterCategory;

  @ApiPropertyOptional({ enum: ENewsletterAudience })
  @IsOptional()
  @IsEnum(ENewsletterAudience)
  audience?: ENewsletterAudience;

  @ApiPropertyOptional({ enum: ENewsletterStatus })
  @IsOptional()
  @IsEnum(ENewsletterStatus)
  status?: ENewsletterStatus;
}

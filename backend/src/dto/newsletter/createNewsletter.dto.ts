import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ENewsletterAudience, ENewsletterCategory } from 'src/generated/prisma/client';

export class CreateNewsletterDto {
  @ApiProperty({ example: 'Nouveautés et événements du mois' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiPropertyOptional({ example: 'Découvrez nos nouveaux horaires et ateliers' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  preheader?: string;

  @ApiProperty({
    example: '<p>Bonjour à tous,</p><p>Découvrez nos nouveaux ateliers et promotions.</p>',
    description: 'Newsletter body in HTML or plain-text format. Supports inline styling, images and file attachments.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500000)
  body: string;

  @ApiPropertyOptional({ example: 'Découvrir nos offres' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaLabel?: string;

  @ApiPropertyOptional({ example: 'https://bibliosquad.com/offres' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^https:\/\/[^\s]+$/i, {
    message: 'ctaUrl must be a secure URL starting with https://',
  })
  ctaUrl?: string;

  @ApiProperty({ enum: ENewsletterCategory, example: ENewsletterCategory.UPDATE })
  @IsEnum(ENewsletterCategory)
  category: ENewsletterCategory;

  @ApiProperty({ enum: ENewsletterAudience, example: ENewsletterAudience.ALL_CLIENTS })
  @IsEnum(ENewsletterAudience)
  audience: ENewsletterAudience;

  @ApiPropertyOptional({ type: [String], example: ['uuid-client-1', 'uuid-client-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificClientIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['uuid-prof-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificProfessorIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['custom@email.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificEmails?: string[];
}

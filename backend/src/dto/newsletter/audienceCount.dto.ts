import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ENewsletterAudience } from 'src/generated/prisma/client';

export class AudienceCountQueryDto {
  @ApiProperty({ enum: ENewsletterAudience, example: ENewsletterAudience.ALL_CLIENTS })
  @IsEnum(ENewsletterAudience)
  audience: ENewsletterAudience;
}

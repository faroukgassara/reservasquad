import { ApiPropertyOptional } from '@nestjs/swagger';
import { ETestimonialStatus } from 'src/generated/prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FetchTestimonialsDto {
    @ApiPropertyOptional({ enum: ETestimonialStatus })
    @IsOptional()
    @IsEnum(ETestimonialStatus)
    status?: ETestimonialStatus;
}

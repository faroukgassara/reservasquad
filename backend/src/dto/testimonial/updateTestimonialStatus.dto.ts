import { IsEnum, IsIn } from 'class-validator';
import { ETestimonialStatus } from 'src/generated/prisma/client';

export class UpdateTestimonialStatusDto {
    @IsEnum(ETestimonialStatus)
    @IsIn([ETestimonialStatus.APPROVED, ETestimonialStatus.REJECTED])
    status!: ETestimonialStatus;
}

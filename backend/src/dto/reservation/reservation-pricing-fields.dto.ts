import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ReservationPriceMode } from 'src/generated/prisma/client';

/** Shared pricing inputs for bookings (TND). */
export class ReservationPricingFieldsDto {
  @ApiProperty({ enum: ReservationPriceMode, description: 'How the reservation total (TND) is computed.' })
  @IsEnum(ReservationPriceMode)
  priceMode: ReservationPriceMode;

  @ApiPropertyOptional({
    description: 'Amount in TND — required only when priceMode is MANUAL',
    minimum: 0,
    maximum: 999_999,
  })
  @ValidateIf((o: ReservationPricingFieldsDto) => o.priceMode === ReservationPriceMode.MANUAL)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999_999)
  manualPrice?: number;
}

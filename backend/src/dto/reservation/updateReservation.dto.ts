import { PartialType } from '@nestjs/swagger';
import { CreateReservationDto } from './createReservation.dto';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

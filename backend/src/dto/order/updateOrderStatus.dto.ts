import { IsEnum } from 'class-validator';
import { EOrderStatus } from 'src/generated/prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(EOrderStatus)
  status!: EOrderStatus;
}

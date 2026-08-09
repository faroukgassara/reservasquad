import { IsEnum, IsOptional } from 'class-validator';
import { EOrderStatus } from 'src/generated/prisma/client';

export class FetchOrdersDto {
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;
}

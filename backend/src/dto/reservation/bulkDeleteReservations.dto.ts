import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteReservationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids!: string[];
}

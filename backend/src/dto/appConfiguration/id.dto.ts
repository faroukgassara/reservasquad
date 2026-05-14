import { IsNumberString } from 'class-validator';

export class IdDto {
    @IsNumberString()
    id: string;
}
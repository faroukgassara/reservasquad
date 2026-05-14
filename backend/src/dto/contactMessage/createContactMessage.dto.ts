import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateContactMessageDto {
    @IsString()
    @MinLength(1)
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(3)
    message!: string;
}

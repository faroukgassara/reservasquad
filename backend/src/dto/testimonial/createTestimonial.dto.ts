import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTestimonialDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(2000)
    description!: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;
}

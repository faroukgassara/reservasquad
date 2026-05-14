import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FileKeyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    key: string;
}
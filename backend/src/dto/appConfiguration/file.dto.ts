import { ApiProperty } from "@nestjs/swagger"
import {IsString } from "class-validator"
import { LangDto } from "./lang.dto"

class FileDto extends LangDto {
    @ApiProperty()
    @IsString()
    file: string
    @ApiProperty()
    @IsString()
    folder: string
}
export {
    FileDto
}
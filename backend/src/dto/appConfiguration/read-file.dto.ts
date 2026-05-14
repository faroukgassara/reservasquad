import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty } from "class-validator"

class ReadFileDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fileId: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fileName: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fileFormat: string
}
export {
    ReadFileDto
}
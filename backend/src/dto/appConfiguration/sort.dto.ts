import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsOptional, IsEnum } from "class-validator"
import { ESort } from "src/enum/sort.enum"

class SortDto {
    @ApiProperty()
    @IsString()
    @IsEnum(ESort)
    @IsOptional()
    sort: ESort

}
export {
    SortDto
}
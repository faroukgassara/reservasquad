import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { FileKeyDto } from "./fileKey.dto";

export class UploadFilePartDto extends FileKeyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    chunk: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    uploadId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    chunkNumber: number;
}

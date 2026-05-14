import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { FileKeyDto } from "./fileKey.dto";
import { Type } from "class-transformer";

export class IUploadPartDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    ETag: string;
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    PartNumber: number;
}

export class CompleteUploadDto extends FileKeyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    uploadId: string;

    @ApiProperty({ type: IUploadPartDto })
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => IUploadPartDto)
    @ValidateNested({ each: true })
    parts: IUploadPartDto[];
}

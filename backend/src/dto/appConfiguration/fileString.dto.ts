import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { EFileStringExtension } from 'src/enum/fileExtension.enum';

export class FileStringDTO {
    @ApiProperty()
    @IsString()
    readonly originalname: string
    @ApiProperty()
    @IsString()
    @MinLength(500)
    readonly file: string
    @ApiProperty()
    @IsString()
    @IsEnum(EFileStringExtension)
    readonly type: string
}
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class IdsDto {
    @ApiProperty({
        description: "List of client IDs to search for",
        example: ['00000001', '00000002'],
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ids: string[];
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Min, IsNumber, IsOptional, IsString, IsNotEmpty } from "class-validator";
import { LangDto } from "./lang.dto";
import { SortDto } from "./sort.dto";

class PaginationDTO extends LangDto {
    @ApiProperty({
        description: 'Requested page number',
        example: 1
    })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10
    })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    perPage: number;
}

class OptionalPaginationDTO extends LangDto {
    @ApiPropertyOptional({
        description: 'Page number (optional)',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of items per page (optional)',
        example: 10
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    perPage?: number;
}

class SearchUserDTO extends OptionalPaginationDTO {
    @ApiPropertyOptional({
        description: 'Search keyword',
        example: 'client'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sorting criteria (field and order)',
        type: [SortDto]
    })
    @IsOptional()
    sorts?: SortDto[];

    @ApiProperty({
        description: "User's role",
        example: 'CLIENT'
    })
    @IsNotEmpty()
    @IsString()
    role: string;
}

class SearchDTO extends OptionalPaginationDTO {
    @ApiPropertyOptional({
        description: 'Search keyword',
        example: 'client'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sorting criteria (field and order)',
        type: [SortDto]
    })
    @IsOptional()
    sorts?: SortDto[];
}

class SearchByIdDTO extends OptionalPaginationDTO {
    @ApiProperty({
        description: 'ID related to the search',
        example: 'promoGroupId'
    })
    @IsNotEmpty()
    @IsString()
    id: string;

    @ApiPropertyOptional({
        description: 'Search keyword',
        example: 'client'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sorting criteria (field and order)',
        type: [SortDto]
    })
    @IsOptional()
    sorts?: SortDto[];
}

export {
    PaginationDTO,
    OptionalPaginationDTO,
    SearchDTO,
    SearchUserDTO,
    SearchByIdDTO
};

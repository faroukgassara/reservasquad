import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEnterpriseDto {
    @ApiPropertyOptional({
        description: 'Name of the enterprise',
        example: 'Acme Corporation Updated'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Whether the enterprise is active',
        example: false
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

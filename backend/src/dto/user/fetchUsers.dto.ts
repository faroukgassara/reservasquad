import { ApiPropertyOptional } from '@nestjs/swagger';
import { ERole, EStatus } from 'src/generated/prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FetchUsersDto {
    @ApiPropertyOptional({
        description: 'Filter by user status',
        enum: EStatus,
        example: EStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(EStatus)
    status?: EStatus;

    @ApiPropertyOptional({
        description: 'Filter by role',
        enum: ERole,
        example: ERole.USER,
    })
    @IsOptional()
    @IsEnum(ERole)
    role?: ERole;
}

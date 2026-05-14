import { IsString, IsOptional, IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnterpriseContactDto {
    @ApiProperty({
        description: 'First name of the contact',
        example: 'John'
    })
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the contact',
        example: 'Doe'
    })
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'Email address of the contact',
        example: 'john.doe@example.com'
    })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        description: 'Optional comment about the contact',
        example: 'Primary contact for technical matters'
    })
    @IsOptional()
    @IsString()
    comment?: string;
}

export class CreateEnterpriseDto {
    @ApiProperty({
        description: 'Name of the enterprise',
        example: 'Acme Corporation'
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Whether the enterprise is active',
        example: true,
        default: true
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'First contact information',
        type: CreateEnterpriseContactDto
    })
    @IsNotEmpty()
    firstContact: CreateEnterpriseContactDto;

    @ApiPropertyOptional({
        description: 'Second contact information (optional)',
        type: CreateEnterpriseContactDto
    })
    @IsOptional()
    secondContact?: CreateEnterpriseContactDto;
}

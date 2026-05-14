import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContactMessageService } from './contact-message.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';
import { CreateContactMessageDto } from 'src/dto/contactMessage/createContactMessage.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@swagger.ApiTags('contact-message-frontoffice')
@Controller('contact')
@Public(true)
@openApiResponse(
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ContactMessageFrontofficeController {
    constructor(private readonly contactMessageService: ContactMessageService) {}

    @Post('message')
    @swagger.ApiOperation({ summary: 'Submit contact form (public)' })
    async submit(@Res() res: Response, @Body() body: CreateContactMessageDto) {
        try {
            const dto = plainToInstance(CreateContactMessageDto, body);
            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map((err) => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }
            const created = await this.contactMessageService.create(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: created,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }
}

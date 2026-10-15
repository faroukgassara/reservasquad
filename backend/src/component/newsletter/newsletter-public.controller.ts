import { Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { NewsletterService } from './newsletter.service';

@swagger.ApiTags('newsletter-public')
@Controller('public/newsletter')
@Public(true)
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class NewsletterPublicController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get('unsubscribe/:token')
  @swagger.ApiOperation({ summary: 'Get unsubscribe info for a client token' })
  async getUnsubscribeInfo(@Res() res: Response, @Param('token') token: string) {
    try {
      const data = await this.newsletterService.getUnsubscribeInfo(token);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('unsubscribe/:token')
  @swagger.ApiOperation({ summary: 'Confirm newsletter unsubscribe for a client token' })
  async unsubscribe(@Res() res: Response, @Param('token') token: string) {
    try {
      const data = await this.newsletterService.unsubscribeByToken(token);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { PosSubscriptionService } from './pos-subscription.service';

@swagger.ApiTags('pos-subscription-card')
@Controller('public/subscription-cards')
@Public(true)
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosSubscriptionCardController {
  constructor(private readonly subscriptionService: PosSubscriptionService) {}

  @Get(':token')
  @swagger.ApiOperation({ summary: 'Member card of a subscription, opened from its QR code' })
  async getCard(@Res() res: Response, @Param('token') token: string) {
    try {
      const data = await this.subscriptionService.getCard(token);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { PosCatalogService } from './pos-catalog.service';

@swagger.ApiTags('pos-public-menu')
@Controller('public/menu')
@Public(true)
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosMenuController {
  constructor(private readonly catalogService: PosCatalogService) {}

  @Get()
  @swagger.ApiOperation({ summary: 'Public café menu (opened from the QR code)' })
  async getMenu(@Res() res: Response) {
    try {
      const data = await this.catalogService.getPublicMenu();
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

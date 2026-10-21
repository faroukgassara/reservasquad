import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import { UpdatePosSettingsDto } from 'src/dto/pos/posSession.dto';
import { PosSessionService } from './pos-session.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-settings-backoffice')
@Controller('backoffice/pos/settings')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosSettingsController {
  constructor(private readonly sessionService: PosSessionService) {}

  @Get()
  @swagger.ApiOperation({ summary: 'Caisse settings (default opening cash and whether cashiers may change it)' })
  async get(@Res() res: Response) {
    try {
      const data = await this.sessionService.getSettings();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Set the opening cash used for every new session' })
  async update(@Res() res: Response, @Req() req: IRequest, @Body() body: UpdatePosSettingsDto) {
    try {
      const dto = await validateBody(UpdatePosSettingsDto, body, res);
      if (!dto) return;
      const data = await this.sessionService.updateSettings(dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

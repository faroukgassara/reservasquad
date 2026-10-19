import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { FetchNotificationsDto } from 'src/dto/notification/fetchNotifications.dto';
import { IRequest } from 'src/interface/request/request.interface';
import { NotificationService } from './notification.service';

@swagger.ApiTags('notifications')
@Controller('backoffice/notifications')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @swagger.ApiOperation({ summary: 'List my notifications (newest first)' })
  async list(@Req() req: IRequest, @Res() res: Response, @Query() query: FetchNotificationsDto) {
    try {
      const data = await this.notificationService.list(
        req.user.id,
        query.page ?? 1,
        query.perPage ?? 20,
        query.unreadOnly ?? false,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('unread-count')
  @swagger.ApiOperation({ summary: 'Count my unread notifications' })
  async unreadCount(@Req() req: IRequest, @Res() res: Response) {
    try {
      const data = await this.notificationService.unreadCount(req.user.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('read-all')
  @swagger.ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@Req() req: IRequest, @Res() res: Response) {
    try {
      const data = await this.notificationService.markAllRead(req.user.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/read')
  @swagger.ApiOperation({ summary: 'Mark one of my notifications as read' })
  async markRead(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    try {
      const data = await this.notificationService.markRead(req.user.id, id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

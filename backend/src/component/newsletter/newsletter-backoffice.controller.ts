import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import {
  ApiPaginationQuery,
  PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import { PaginationData } from 'src/common/pagination/types';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from 'src/dto/newsletter/createNewsletter.dto';
import { UpdateNewsletterDto } from 'src/dto/newsletter/updateNewsletter.dto';
import { FetchNewslettersDto } from 'src/dto/newsletter/fetchNewsletters.dto';
import { SendTestNewsletterDto } from 'src/dto/newsletter/sendTestNewsletter.dto';
import { AudienceCountQueryDto } from 'src/dto/newsletter/audienceCount.dto';

@swagger.ApiTags('newsletter-backoffice')
@Controller('backoffice/newsletter')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class NewsletterBackofficeController {
  constructor(private readonly newsletterService: NewsletterService) {}

  private async validateDto<T extends object>(
    cls: new () => T,
    body: object,
    res: Response,
  ): Promise<T | null> {
    const dto = plainToInstance(cls, body);
    const errors = await validate(dto as object);
    if (errors.length > 0) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        })),
      });
      return null;
    }
    return dto;
  }

  @Get('search-recipients')
  @swagger.ApiOperation({ summary: 'Search eligible recipients (clients and professors) for newsletter' })
  async searchRecipients(@Res() res: Response, @Query('search') search?: string) {
    try {
      const data = await this.newsletterService.searchRecipients(search);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('audience-count')
  @swagger.ApiOperation({ summary: 'Count of eligible recipients for an audience' })
  async getAudienceCount(@Res() res: Response, @Query() query: AudienceCountQueryDto) {
    try {
      const data = await this.newsletterService.getAudienceCount(query.audience);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('list')
  @swagger.ApiOperation({ summary: 'List newsletters with pagination and filters' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async list(
    @Res() res: Response,
    @Query() query: FetchNewslettersDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.newsletterService.list(query, pagination);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('deleted')
  @swagger.ApiOperation({ summary: 'List soft-deleted newsletters with pagination and filters' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async listDeleted(
    @Res() res: Response,
    @Query() query: FetchNewslettersDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.newsletterService.listDeletedNewsletters(pagination, query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Get newsletter details with recent recipients' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.newsletterService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('upload')
  @swagger.ApiOperation({ summary: 'Upload an image or document for newsletter body' })
  @swagger.ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async upload(
    @Res() res: Response,
    @Req() req: IRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const data = await this.newsletterService.uploadMedia(file, req);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @swagger.ApiOperation({ summary: 'Create a draft newsletter' })
  async create(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreateNewsletterDto,
  ) {
    try {
      const dto = await this.validateDto(CreateNewsletterDto, body, res);
      if (!dto) return;
      const data = await this.newsletterService.create(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Put(':id')
  @swagger.ApiOperation({ summary: 'Update a draft newsletter' })
  async update(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: UpdateNewsletterDto,
  ) {
    try {
      const dto = await this.validateDto(UpdateNewsletterDto, body, res);
      if (!dto) return;
      const data = await this.newsletterService.update(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @swagger.ApiOperation({ summary: 'Delete a draft newsletter' })
  async remove(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.newsletterService.remove(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/restore')
  @swagger.ApiOperation({ summary: 'Restore a soft-deleted newsletter' })
  async restore(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.newsletterService.restoreNewsletter(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id/hard')
  @swagger.ApiOperation({ summary: 'Permanently delete a newsletter' })
  async hardDelete(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.newsletterService.hardDeleteNewsletter(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/test')
  @swagger.ApiOperation({ summary: 'Send a test newsletter email to an address' })
  async sendTest(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: SendTestNewsletterDto,
  ) {
    try {
      const dto = await this.validateDto(SendTestNewsletterDto, body, res);
      if (!dto) return;
      const data = await this.newsletterService.sendTest(id, dto.email);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/send')
  @swagger.ApiOperation({ summary: 'Trigger sending newsletter to the selected audience' })
  async send(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.newsletterService.send(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

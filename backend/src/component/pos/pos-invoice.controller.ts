import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  ApiPaginationQuery,
  PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import { PaginationData } from 'src/common/pagination/types';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import {
  FetchInvoicesDto,
  SaveInvoiceDto,
} from 'src/dto/pos/posInvoice.dto';
import { PosInvoiceService } from './pos-invoice.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-invoice-backoffice')
@Controller('backoffice/pos/invoices')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosInvoiceController {
  constructor(private readonly invoiceService: PosInvoiceService) {}

  @Get('list')
  @swagger.ApiOperation({ summary: 'List invoices and credit notes' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  async list(
    @Res() res: Response,
    @Query() query: FetchInvoicesDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
  ) {
    try {
      const data = await this.invoiceService.list(query, pagination);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @swagger.ApiOperation({ summary: 'Create a draft invoice' })
  async create(@Res() res: Response, @Req() req: IRequest, @Body() body: SaveInvoiceDto) {
    try {
      const dto = await validateBody(SaveInvoiceDto, body, res);
      if (!dto) return;
      const data = await this.invoiceService.create(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('payments/:paymentId')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete an invoice payment' })
  async deletePayment(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('paymentId') paymentId: string,
  ) {
    try {
      const data = await this.invoiceService.deletePayment(paymentId, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Invoice detail' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.getById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @swagger.ApiOperation({ summary: 'Update a draft invoice' })
  async update(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: SaveInvoiceDto,
  ) {
    try {
      const dto = await validateBody(SaveInvoiceDto, body, res);
      if (!dto) return;
      const data = await this.invoiceService.update(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/post')
  @swagger.ApiOperation({ summary: 'Post (validate) an invoice and give it a number' })
  async post(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.post(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/draft')
  @swagger.ApiOperation({ summary: 'Reset an invoice to draft' })
  async resetToDraft(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.resetToDraft(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/cancel')
  @swagger.ApiOperation({ summary: 'Cancel an invoice' })
  async cancel(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.cancel(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id/credit-note')
  @swagger.ApiOperation({ summary: 'Create a draft credit note from a posted invoice' })
  async creditNote(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.createCreditNote(id, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a draft or cancelled invoice' })
  async remove(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.invoiceService.remove(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

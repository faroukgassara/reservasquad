import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreditService } from './credit.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  ApiPaginationQuery,
  PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import {
  ApiSortingQuery,
  SortingQuery,
} from 'src/common/decorator/sorting-query.decorator';
import {
  ApiSearchQuery,
  SearchQuery,
} from 'src/common/decorator/search-query.decorator';
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import {
  CreateCreditClientDto,
  UpdateCreditClientDto,
} from 'src/dto/credit/creditClient.dto';
import { CreateCreditDto, CreateCreditPaymentDto } from 'src/dto/credit/credit.dto';

const CLIENT_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'updatedAt', 'firstName', 'lastName'],
  defaultSort: 'createdAt',
};

const CLIENT_SEARCH_FIELDS = ['firstName', 'lastName', 'phone'];

@swagger.ApiTags('credit-backoffice')
@Controller('backoffice/credit')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class CreditBackofficeController {
  constructor(private readonly creditService: CreditService) {}

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

  @Get('summary')
  @swagger.ApiOperation({ summary: 'Global credit totals' })
  async summary(@Res() res: Response) {
    try {
      const data = await this.creditService.getSummary();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('clients/list')
  @swagger.ApiOperation({ summary: 'List credit clients with their balance' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(CLIENT_SORTING_OPTIONS)
  @ApiSearchQuery({ fields: CLIENT_SEARCH_FIELDS })
  async listClients(
    @Res() res: Response,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(CLIENT_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
    @SearchQuery({ fields: CLIENT_SEARCH_FIELDS }) search: object,
  ) {
    try {
      const data = await this.creditService.listClients(pagination, orderBy, search as never);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('clients')
  @swagger.ApiOperation({ summary: 'Create a credit client' })
  async createClient(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreateCreditClientDto,
  ) {
    try {
      const dto = await this.validateDto(CreateCreditClientDto, body, res);
      if (!dto) return;
      const data = await this.creditService.createClient(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('clients/:id')
  @swagger.ApiOperation({ summary: 'Credit client detail with credits and payments' })
  async getClient(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.creditService.getClientDetail(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('clients/:id')
  @swagger.ApiOperation({ summary: 'Update a credit client' })
  async updateClient(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: UpdateCreditClientDto,
  ) {
    try {
      const dto = await this.validateDto(UpdateCreditClientDto, body, res);
      if (!dto) return;
      const data = await this.creditService.updateClient(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('clients/:id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a credit client' })
  async deleteClient(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.creditService.deleteClient(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('credits')
  @swagger.ApiOperation({ summary: 'Add a credit to a client' })
  async createCredit(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreateCreditDto,
  ) {
    try {
      const dto = await this.validateDto(CreateCreditDto, body, res);
      if (!dto) return;
      const data = await this.creditService.createCredit(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('credits/:id/payments')
  @swagger.ApiOperation({ summary: 'Record a payment on a credit' })
  async addPayment(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: CreateCreditPaymentDto,
  ) {
    try {
      const dto = await this.validateDto(CreateCreditPaymentDto, body, res);
      if (!dto) return;
      const data = await this.creditService.addPayment(id, dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('credits/:id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a credit' })
  async deleteCredit(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.creditService.deleteCredit(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('payments/:id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a payment' })
  async deletePayment(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.creditService.deletePayment(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

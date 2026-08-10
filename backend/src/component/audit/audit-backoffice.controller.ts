import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as swagger from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
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
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';
import { FetchAuditLogDto } from 'src/dto/audit/fetchAuditLog.dto';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const AUDIT_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'entityType', 'action'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('audit-log-backoffice')
@Controller('backoffice/audit-log')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class AuditBackofficeController {
  constructor(private readonly auditService: AuditService) {}

  @Get('list')
  @swagger.ApiOperation({ summary: 'List audit log entries (admin)' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 20, maxPerPage: 100 })
  @ApiSortingQuery(AUDIT_SORTING_OPTIONS)
  async list(
    @Res() res: Response,
    @Query() query: FetchAuditLogDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 20, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(AUDIT_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
  ) {
    try {
      const data = await this.auditService.list(query, pagination, orderBy);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

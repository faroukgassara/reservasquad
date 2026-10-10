import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { SalesDetailsQueryDto } from 'src/dto/pos/posReport.dto';
import { PosReportService } from './pos-report.service';
import { validateBody } from './pos.utils';

@swagger.ApiTags('pos-report-backoffice')
@Controller('backoffice/pos/reports')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosReportController {
  constructor(private readonly reportService: PosReportService) {}

  @Get('sales-details')
  @swagger.ApiOperation({ summary: 'Products, payments and taxes of POS sales in a period' })
  async salesDetails(@Res() res: Response, @Query() query: SalesDetailsQueryDto) {
    try {
      const dto = await validateBody(SalesDetailsQueryDto, query, res);
      if (!dto) return;
      const data = await this.reportService.salesDetails(dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

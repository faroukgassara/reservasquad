import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { Response } from 'express';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { ProductAnalyticsQueryDto } from './dto/product-analytics-query.dto';
import { ProductAnalyticsService } from './product-analytics.service';

@swagger.ApiTags('analytics')
@Controller(['analytics', 'backoffice/pos/analytics'])
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ProductAnalyticsController {
  constructor(private readonly analyticsService: ProductAnalyticsService) {}

  @Get('products')
  @swagger.ApiOperation({
    summary: 'Get product sales analytics, top-selling products, and monthly trends',
  })
  async getProductAnalytics(
    @Res() res: Response,
    @Query() query: ProductAnalyticsQueryDto,
  ) {
    try {
      const data = await this.analyticsService.getProductAnalytics(query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/:id')
  @swagger.ApiOperation({
    summary: 'Get sales performance breakdown for a specific product ID',
  })
  async getProductBreakdown(
    @Res() res: Response,
    @Param('id') id: string,
    @Query() query: ProductAnalyticsQueryDto,
  ) {
    try {
      const data = await this.analyticsService.getProductAnalytics({
        ...query,
        productId: id,
      });
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

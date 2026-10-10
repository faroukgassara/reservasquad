import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
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
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { IRequest } from 'src/interface/request/request.interface';
import {
  CreatePosCategoryDto,
  CreatePosProductDto,
  CreatePosStockEntryDto,
  FetchPosProductsDto,
  UpdatePosCategoryDto,
  UpdatePosProductDto,
} from 'src/dto/pos/posCatalog.dto';
import { PosCatalogService } from './pos-catalog.service';
import { validateBody } from './pos.utils';

const PRODUCT_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['name', 'price', 'stockQty', 'createdAt'],
  defaultSort: 'name',
};

@swagger.ApiTags('pos-catalog-backoffice')
@Controller('backoffice/pos')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class PosCatalogController {
  constructor(private readonly catalogService: PosCatalogService) {}

  @Get('categories')
  @swagger.ApiOperation({ summary: 'List POS categories' })
  async listCategories(@Res() res: Response) {
    try {
      const data = await this.catalogService.listCategories();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('categories')
  @swagger.ApiOperation({ summary: 'Create a POS category' })
  async createCategory(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreatePosCategoryDto,
  ) {
    try {
      const dto = await validateBody(CreatePosCategoryDto, body, res);
      if (!dto) return;
      const data = await this.catalogService.createCategory(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('categories/:id')
  @swagger.ApiOperation({ summary: 'Update a POS category' })
  async updateCategory(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: UpdatePosCategoryDto,
  ) {
    try {
      const dto = await validateBody(UpdatePosCategoryDto, body, res);
      if (!dto) return;
      const data = await this.catalogService.updateCategory(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('categories/:id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a POS category' })
  async deleteCategory(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.catalogService.deleteCategory(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/list')
  @swagger.ApiOperation({ summary: 'List POS products (paginated)' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(PRODUCT_SORTING_OPTIONS)
  async listProducts(
    @Res() res: Response,
    @Query() query: FetchPosProductsDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(PRODUCT_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
  ) {
    try {
      const data = await this.catalogService.listProducts(query, pagination, orderBy);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/available')
  @swagger.ApiOperation({ summary: 'Products available on the register' })
  async listAvailableProducts(@Res() res: Response) {
    try {
      const data = await this.catalogService.listAvailableProducts();
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('products')
  @swagger.ApiOperation({ summary: 'Create a POS product' })
  async createProduct(
    @Res() res: Response,
    @Req() req: IRequest,
    @Body() body: CreatePosProductDto,
  ) {
    try {
      const dto = await validateBody(CreatePosProductDto, body, res);
      if (!dto) return;
      const data = await this.catalogService.createProduct(dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/:id/stats')
  @swagger.ApiOperation({ summary: 'Bought / sold / remaining quantities' })
  async productStats(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.catalogService.getProductStats(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/:id/stock-entries')
  @swagger.ApiOperation({ summary: 'List purchases of a product' })
  async listStockEntries(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.catalogService.listStockEntries(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('products/:id/stock-entries')
  @swagger.ApiOperation({ summary: 'Record a purchase (adds stock)' })
  async createStockEntry(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: CreatePosStockEntryDto,
  ) {
    try {
      const dto = await validateBody(CreatePosStockEntryDto, body, res);
      if (!dto) return;
      const data = await this.catalogService.createStockEntry(id, dto, req.user?.id);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('products/:id')
  @swagger.ApiOperation({ summary: 'POS product detail' })
  async getProduct(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.catalogService.getProductById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('products/:id')
  @swagger.ApiOperation({ summary: 'Update a POS product' })
  async updateProduct(
    @Res() res: Response,
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() body: UpdatePosProductDto,
  ) {
    try {
      const dto = await validateBody(UpdatePosProductDto, body, res);
      if (!dto) return;
      const data = await this.catalogService.updateProduct(id, dto, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('products/:id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Delete a POS product' })
  async deleteProduct(@Res() res: Response, @Req() req: IRequest, @Param('id') id: string) {
    try {
      const data = await this.catalogService.deleteProduct(id, req.user?.id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

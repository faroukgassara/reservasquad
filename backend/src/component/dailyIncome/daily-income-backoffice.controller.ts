import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DailyIncomeService } from './daily-income.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateDailyIncomeDto } from 'src/dto/dailyIncome/createDailyIncome.dto';
import { UpdateDailyIncomeDto } from 'src/dto/dailyIncome/updateDailyIncome.dto';
import { FetchDailyIncomeDto } from 'src/dto/dailyIncome/fetchDailyIncome.dto';
import {
  CreateIncomeLineDto,
  UpdateIncomeLineDto,
} from 'src/dto/dailyIncome/createIncomeLine.dto';
import { FetchIncomeLinesDto } from 'src/dto/dailyIncome/fetchIncomeLines.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

@swagger.ApiTags('daily-income-backoffice')
@Controller('backoffice/daily-income')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class DailyIncomeBackofficeController {
  constructor(private readonly dailyIncomeService: DailyIncomeService) {}

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

  @Get('list')
  @swagger.ApiOperation({ summary: 'List daily income for a month' })
  async list(@Res() res: Response, @Query() query: FetchDailyIncomeDto) {
    try {
      const data = await this.dailyIncomeService.listDailyIncomes(query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('summary')
  @swagger.ApiOperation({ summary: 'Month summary totals' })
  async summary(@Res() res: Response, @Query() query: FetchDailyIncomeDto) {
    try {
      const data = await this.dailyIncomeService.getSummary(query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('trend')
  @swagger.ApiOperation({ summary: 'Income trend over the last N months' })
  async trend(@Res() res: Response, @Query('months') months?: string) {
    try {
      const parsed = months !== undefined ? Number(months) : 6;
      const data = await this.dailyIncomeService.getTrend(
        Number.isFinite(parsed) ? parsed : 6,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('lines')
  @swagger.ApiOperation({ summary: 'List income lines for a month' })
  async listLines(@Res() res: Response, @Query() query: FetchIncomeLinesDto) {
    try {
      const data = await this.dailyIncomeService.listIncomeLines(query);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('lines')
  @swagger.ApiOperation({ summary: 'Create an income line' })
  async createLine(@Res() res: Response, @Body() body: CreateIncomeLineDto) {
    try {
      const dto = await this.validateDto(CreateIncomeLineDto, body, res);
      if (!dto) return;
      const line = await this.dailyIncomeService.createIncomeLine(dto);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data: line });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post('lines/:id')
  @swagger.ApiOperation({ summary: 'Update an income line' })
  async updateLine(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateIncomeLineDto,
  ) {
    try {
      const dto = await this.validateDto(UpdateIncomeLineDto, body, res);
      if (!dto) return;
      const line = await this.dailyIncomeService.updateIncomeLine(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: line });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete('lines/:id')
  @swagger.ApiOperation({ summary: 'Delete an income line' })
  async removeLine(@Res() res: Response, @Param('id') id: string) {
    try {
      const line = await this.dailyIncomeService.deleteIncomeLine(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: line });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post()
  @swagger.ApiOperation({ summary: 'Create a daily income entry' })
  async create(@Res() res: Response, @Body() body: CreateDailyIncomeDto) {
    try {
      const dto = await this.validateDto(CreateDailyIncomeDto, body, res);
      if (!dto) return;
      const row = await this.dailyIncomeService.createDailyIncome(dto);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data: row });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Get daily income by id' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.dailyIncomeService.getDailyIncomeById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @swagger.ApiOperation({ summary: 'Update a daily income entry' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateDailyIncomeDto,
  ) {
    try {
      const dto = await this.validateDto(UpdateDailyIncomeDto, body, res);
      if (!dto) return;
      const row = await this.dailyIncomeService.updateDailyIncome(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: row });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @swagger.ApiOperation({ summary: 'Delete a daily income entry' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const row = await this.dailyIncomeService.deleteDailyIncome(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: row });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

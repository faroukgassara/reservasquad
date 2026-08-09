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
import { RoomService } from './room.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateRoomDto } from 'src/dto/room/createRoom.dto';
import { UpdateRoomDto } from 'src/dto/room/updateRoom.dto';
import { FetchRoomsDto } from 'src/dto/room/fetchRooms.dto';
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
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';

const ROOM_SORTING_OPTIONS: SortingDecoratorOptions = {
  allowedFields: ['createdAt', 'updatedAt', 'name', 'capacity', 'pricePerHour'],
  defaultSort: 'createdAt',
};

@swagger.ApiTags('room-backoffice')
@Controller('backoffice/room')
@Roles({ roles: ['ADMIN', 'USER'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
  { status: HttpStatus.OK, description: 'OK' },
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class RoomBackofficeController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Create a room' })
  async create(@Res() res: Response, @Body() body: CreateRoomDto) {
    try {
      const dto = plainToInstance(CreateRoomDto, body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          })),
        });
      }
      const room = await this.roomService.createRoom(dto);
      return res.status(HttpStatus.CREATED).json({ statusCode: HttpStatus.CREATED, data: room });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Post(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Update a room' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateRoomDto,
  ) {
    try {
      const dto = plainToInstance(UpdateRoomDto, body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          })),
        });
      }
      const room = await this.roomService.updateRoom(id, dto);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: room });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get('list')
  @swagger.ApiOperation({ summary: 'List rooms' })
  @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
  @ApiSortingQuery(ROOM_SORTING_OPTIONS)
  @ApiSearchQuery({ fields: ['name'] })
  async list(
    @Res() res: Response,
    @Query() query: FetchRoomsDto,
    @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    pagination: PaginationData,
    @SortingQuery(ROOM_SORTING_OPTIONS) orderBy: Record<string, unknown>[],
    @SearchQuery({ fields: ['name'] }) search: object,
  ) {
    try {
      const data = await this.roomService.listRooms(
        query,
        pagination,
        orderBy,
        search as never,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Get(':id')
  @swagger.ApiOperation({ summary: 'Get room by id' })
  async getOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const room = await this.roomService.getRoomById(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: room });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  @Delete(':id')
  @Roles({ roles: ['ADMIN'] })
  @swagger.ApiOperation({ summary: 'Soft-delete a room' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const room = await this.roomService.softDeleteRoom(id);
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: room });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }
}

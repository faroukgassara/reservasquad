import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from 'src/dto/room/create-room.dto';
import { UpdateRoomDto } from 'src/dto/room/update-room.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Public(true)
  @Get()
  @ApiOperation({ summary: 'List rooms (public, for booking form)' })
  list() {
    return this.roomService.list();
  }

  @Public(true)
  @Get(':id')
  @ApiOperation({ summary: 'Get room (public)' })
  getOne(@Param('id') id: string) {
    return this.roomService.getById(id);
  }

  @Post()
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Create room (admin)' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Update room (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('Authorization')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Delete room (admin)' })
  remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
}

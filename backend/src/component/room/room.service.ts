import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from 'src/dto/room/createRoom.dto';
import { UpdateRoomDto } from 'src/dto/room/updateRoom.dto';
import { FetchRoomsDto } from 'src/dto/room/fetchRooms.dto';
import { Prisma, Room } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { FileUploadService } from 'src/common/common-services/file-upload.service';

const ROOM_IMAGES_TYPE = 'coworking-rooms';

function isBase64DataUrl(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.startsWith('data:image/') &&
    value.includes(';base64,')
  );
}

@Injectable()
export class RoomService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  private async resolveImage(value?: string | null): Promise<string | null> {
    if (!value?.trim()) return null;
    if (isBase64DataUrl(value)) {
      return this.fileUploadService.convertBase64(ROOM_IMAGES_TYPE, value);
    }
    return value.trim();
  }

  async createRoom(dto: CreateRoomDto): Promise<Room> {
    const imageUrl = await this.resolveImage(dto.imageUrl);
    return this.prismaService.room.create({
      data: {
        name: dto.name.trim(),
        capacity: dto.capacity,
        pricePerHour: dto.pricePerHour,
        imageUrl,
      },
    });
  }

  async updateRoom(id: string, dto: UpdateRoomDto): Promise<Room> {
    await this.getRoomById(id);
    const data: Prisma.RoomUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      ...(dto.pricePerHour !== undefined && { pricePerHour: dto.pricePerHour }),
    };
    if (dto.imageUrl !== undefined) {
      data.imageUrl = await this.resolveImage(dto.imageUrl);
    }
    return this.prismaService.room.update({ where: { id }, data });
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.prismaService.room.findFirst({
      where: { id, deletedAt: null },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async listRooms(
    _query: FetchRoomsDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.RoomWhereInput,
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.room as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: null }, andWhere),
        orderBy,
      },
      pagination,
    );
  }

  async softDeleteRoom(id: string): Promise<Room> {
    await this.getRoomById(id);
    return this.prismaService.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countActive(): Promise<number> {
    return this.prismaService.room.count({
      where: { deletedAt: null },
    });
  }
}

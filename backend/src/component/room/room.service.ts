import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from 'src/dto/room/create-room.dto';
import { UpdateRoomDto } from 'src/dto/room/update-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.room.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        name: dto.name,
        capacity: dto.capacity,
        color: dto.color,
        description: dto.description ?? null,
        equipment: dto.equipment,
      },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.getById(id);
    return this.prisma.room.update({
      where: { id },
      data: {
        name: dto.name,
        capacity: dto.capacity,
        color: dto.color,
        description: dto.description === undefined ? undefined : dto.description,
        equipment: dto.equipment,
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.room.delete({ where: { id } });
    return { deleted: true };
  }
}

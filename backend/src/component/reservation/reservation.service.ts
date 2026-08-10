import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from 'src/dto/reservation/createReservation.dto';
import { UpdateReservationDto } from 'src/dto/reservation/updateReservation.dto';
import { FetchReservationsDto } from 'src/dto/reservation/fetchReservations.dto';
import { CalendarQueryDto } from 'src/dto/reservation/calendarQuery.dto';
import {
  EReservationStatus,
  Prisma,
  Reservation,
  Room,
} from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

const reservationInclude = {
  room: true,
  professor: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class ReservationService {
  constructor(private readonly prismaService: PrismaService) {}

  private assertValidRange(startAt: Date, endAt: Date) {
    if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }
    if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid endAt');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }
  }

  private hoursBetween(startAt: Date, endAt: Date): number {
    return (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  }

  private calculatePrice(room: Room, startAt: Date, endAt: Date): string {
    const hours = this.hoursBetween(startAt, endAt);
    const rate = Number(room.pricePerHour);
    const total = Math.round(hours * rate * 100) / 100;
    return total.toFixed(2);
  }

  private async assertRoomExists(roomId: string) {
    const room = await this.prismaService.room.findFirst({
      where: { id: roomId, deletedAt: null },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  private async assertProfessorExists(professorId?: string | null) {
    if (!professorId) return null;
    const professor = await this.prismaService.professor.findFirst({
      where: { id: professorId, deletedAt: null },
    });
    if (!professor) throw new NotFoundException('Professor not found');
    return professor;
  }

  private async assertNoOverlap(params: {
    roomId: string;
    startAt: Date;
    endAt: Date;
    excludeId?: string;
    status: EReservationStatus;
  }) {
    if (params.status !== EReservationStatus.CONFIRMED) return;

    const conflict = await this.prismaService.reservation.findFirst({
      where: {
        deletedAt: null,
        roomId: params.roomId,
        status: EReservationStatus.CONFIRMED,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
        startAt: { lt: params.endAt },
        endAt: { gt: params.startAt },
      },
    });

    if (conflict) {
      throw new ConflictException('This room is already reserved for the selected time range');
    }
  }

  private resolvePrice(
    room: Room,
    startAt: Date,
    endAt: Date,
    manualPrice?: number,
  ): string {
    if (manualPrice !== undefined && manualPrice !== null && !Number.isNaN(Number(manualPrice))) {
      return Number(manualPrice).toFixed(2);
    }
    return this.calculatePrice(room, startAt, endAt);
  }

  async createReservation(
    dto: CreateReservationDto,
    createdById?: string,
  ): Promise<Reservation> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidRange(startAt, endAt);
    const room = await this.assertRoomExists(dto.roomId);
    await this.assertProfessorExists(dto.professorId);
    const status = dto.status ?? EReservationStatus.CONFIRMED;
    await this.assertNoOverlap({
      roomId: dto.roomId,
      startAt,
      endAt,
      status,
    });

    return this.prismaService.reservation.create({
      data: {
        title: dto.title?.trim() || null,
        roomId: dto.roomId,
        professorId: dto.professorId || null,
        startAt,
        endAt,
        price: this.resolvePrice(room, startAt, endAt, dto.price),
        isPaid: dto.isPaid ?? false,
        status,
        notes: dto.notes?.trim() || null,
        createdById: createdById || null,
      },
      include: reservationInclude,
    });
  }

  async updateReservation(
    id: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    const existing = await this.getReservationById(id);
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    this.assertValidRange(startAt, endAt);

    const roomId = dto.roomId ?? existing.roomId;
    const room =
      dto.roomId || dto.startAt || dto.endAt || dto.price !== undefined
        ? await this.assertRoomExists(roomId)
        : existing.room;

    if (dto.professorId !== undefined) await this.assertProfessorExists(dto.professorId);

    const status = dto.status ?? existing.status;
    await this.assertNoOverlap({
      roomId,
      startAt,
      endAt,
      excludeId: id,
      status,
    });

    const shouldRecalcPrice =
      dto.price === undefined &&
      (dto.roomId !== undefined || dto.startAt !== undefined || dto.endAt !== undefined);

    return this.prismaService.reservation.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title?.trim() || null }),
        ...(dto.roomId !== undefined && { roomId: dto.roomId }),
        ...(dto.professorId !== undefined && {
          professorId: dto.professorId || null,
        }),
        ...(dto.startAt !== undefined && { startAt }),
        ...(dto.endAt !== undefined && { endAt }),
        ...(dto.price !== undefined && {
          price: this.resolvePrice(room, startAt, endAt, dto.price),
        }),
        ...(shouldRecalcPrice && { price: this.calculatePrice(room, startAt, endAt) }),
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
      include: reservationInclude,
    });
  }

  async getReservationById(id: string) {
    const reservation = await this.prismaService.reservation.findFirst({
      where: { id, deletedAt: null },
      include: reservationInclude,
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async listReservations(
    query: FetchReservationsDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.ReservationWhereInput,
  ) {
    const andWhere = buildAndFilters(
      query.status ? { status: query.status } : undefined,
      query.roomId ? { roomId: query.roomId } : undefined,
      query.professorId ? { professorId: query.professorId } : undefined,
      query.isPaid !== undefined ? { isPaid: query.isPaid } : undefined,
      search,
    );
    const proxied = ProxyPrismaModel(this.prismaService.reservation as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: null }, andWhere),
        include: reservationInclude,
        orderBy,
      },
      pagination,
    );
  }

  async calendar(query: CalendarQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    this.assertValidRange(from, to);

    return this.prismaService.reservation.findMany({
      where: {
        deletedAt: null,
        status: EReservationStatus.CONFIRMED,
        startAt: { lt: to },
        endAt: { gt: from },
        ...(query.roomId ? { roomId: query.roomId } : {}),
      },
      include: reservationInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  async cancelReservation(id: string) {
    await this.getReservationById(id);
    return this.prismaService.reservation.update({
      where: { id },
      data: { status: EReservationStatus.CANCELLED },
      include: reservationInclude,
    });
  }

  async deleteReservation(id: string) {
    await this.getReservationById(id);
    return this.prismaService.reservation.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: reservationInclude,
    });
  }

  async dashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [rooms, professors, todayReservations] = await Promise.all([
      this.prismaService.room.count({
        where: { deletedAt: null },
      }),
      this.prismaService.professor.count({
        where: { deletedAt: null },
      }),
      this.prismaService.reservation.count({
        where: {
          deletedAt: null,
          status: EReservationStatus.CONFIRMED,
          startAt: { lt: endOfDay },
          endAt: { gt: startOfDay },
        },
      }),
    ]);

    return { rooms, professors, todayReservations };
  }
}

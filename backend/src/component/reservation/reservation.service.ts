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
import { CreateReservationSeriesDto } from 'src/dto/reservation/createReservationSeries.dto';
import { randomUUID } from 'crypto';
import {
  EReservationStatus,
  Prisma,
  Reservation,
  Room,
} from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { AuditService } from '../audit/audit.service';

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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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

  private async assertNoConflicts(params: {
    roomId: string;
    professorId?: string | null;
    startAt: Date;
    endAt: Date;
    excludeId?: string;
    status: EReservationStatus;
    /** When set, conflict messages include this ISO timestamp (series create). */
    occurrenceAt?: Date;
  }) {
    if (params.status !== EReservationStatus.CONFIRMED) return;

    const excludeFilter = params.excludeId
      ? { id: { not: params.excludeId } }
      : {};
    const at = params.occurrenceAt?.toISOString();

    const roomConflict = await this.prismaService.reservation.findFirst({
      where: {
        deletedAt: null,
        roomId: params.roomId,
        status: EReservationStatus.CONFIRMED,
        ...excludeFilter,
        startAt: { lt: params.endAt },
        endAt: { gt: params.startAt },
      },
    });

    if (roomConflict) {
      throw new ConflictException(
        at
          ? `This room is already reserved on ${at}`
          : 'This room is already reserved for the selected time range',
      );
    }

    if (!params.professorId) return;

    const professorConflict = await this.prismaService.reservation.findFirst({
      where: {
        deletedAt: null,
        professorId: params.professorId,
        status: EReservationStatus.CONFIRMED,
        ...excludeFilter,
        startAt: { lt: params.endAt },
        endAt: { gt: params.startAt },
      },
    });

    if (professorConflict) {
      throw new ConflictException(
        at
          ? `This professor is already booked on ${at}`
          : 'This professor is already booked for the selected time range',
      );
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

  async availability(
    startAtInput: string,
    endAtInput: string,
    excludeReservationId?: string,
  ) {
    const startAt = new Date(startAtInput);
    const endAt = new Date(endAtInput);
    this.assertValidRange(startAt, endAt);

    const rooms = await this.prismaService.room.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const conflicts = await this.prismaService.reservation.findMany({
      where: {
        deletedAt: null,
        status: EReservationStatus.CONFIRMED,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
      select: { roomId: true },
    });
    const busyRoomIds = new Set(conflicts.map((row) => row.roomId));

    const available = rooms
      .filter((room) => !busyRoomIds.has(room.id))
      .map((room) => {
        const estimatedPrice = Number(this.calculatePrice(room, startAt, endAt));
        return {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          pricePerHour: Number(room.pricePerHour),
          estimatedPrice,
        };
      })
      .sort((a, b) => a.estimatedPrice - b.estimatedPrice || a.name.localeCompare(b.name));

    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      rooms: available,
    };
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
    await this.assertNoConflicts({
      roomId: dto.roomId,
      professorId: dto.professorId,
      startAt,
      endAt,
      status,
    });

    const created = await this.prismaService.reservation.create({
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

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: created.id,
      action: 'CREATE',
      userId: createdById,
      summary: `Created reservation for ${created.room.name}`,
      metadata: { roomId: created.roomId, startAt: created.startAt, endAt: created.endAt },
    });

    return created;
  }

  private expandSeriesOccurrences(
    startAt: Date,
    endAt: Date,
    frequency: 'WEEKLY' | 'MONTHLY',
    until: Date,
  ): { startAt: Date; endAt: Date }[] {
    const durationMs = endAt.getTime() - startAt.getTime();
    const untilEnd = new Date(until);
    untilEnd.setHours(23, 59, 59, 999);

    const occurrences: { startAt: Date; endAt: Date }[] = [];
    let cursor = new Date(startAt);
    const maxOccurrences = 52;

    while (cursor <= untilEnd && occurrences.length < maxOccurrences) {
      occurrences.push({
        startAt: new Date(cursor),
        endAt: new Date(cursor.getTime() + durationMs),
      });
      if (frequency === 'WEEKLY') {
        cursor.setDate(cursor.getDate() + 7);
      } else {
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    if (occurrences.length === 0) {
      throw new BadRequestException('No occurrences fall within the selected range');
    }
    return occurrences;
  }

  async createReservationSeries(
    dto: CreateReservationSeriesDto,
    createdById?: string,
  ) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidRange(startAt, endAt);
    const until = new Date(dto.until);
    if (Number.isNaN(until.getTime())) {
      throw new BadRequestException('Invalid until date');
    }
    if (until < startAt) {
      throw new BadRequestException('until must be on or after the first occurrence');
    }

    const room = await this.assertRoomExists(dto.roomId);
    await this.assertProfessorExists(dto.professorId);
    const status = dto.status ?? EReservationStatus.CONFIRMED;
    const occurrences = this.expandSeriesOccurrences(
      startAt,
      endAt,
      dto.frequency,
      until,
    );

    for (const occurrence of occurrences) {
      await this.assertNoConflicts({
        roomId: dto.roomId,
        professorId: dto.professorId,
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        status,
        occurrenceAt: occurrence.startAt,
      });
    }

    const seriesId = randomUUID();
    const created = await this.prismaService.$transaction(
      occurrences.map((occurrence) =>
        this.prismaService.reservation.create({
          data: {
            title: dto.title?.trim() || null,
            roomId: dto.roomId,
            professorId: dto.professorId || null,
            startAt: occurrence.startAt,
            endAt: occurrence.endAt,
            price: this.resolvePrice(
              room,
              occurrence.startAt,
              occurrence.endAt,
              dto.price,
            ),
            isPaid: dto.isPaid ?? false,
            status,
            notes: dto.notes?.trim() || null,
            seriesId,
            createdById: createdById || null,
          },
          include: reservationInclude,
        }),
      ),
    );

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: seriesId,
      action: 'SERIES_CREATE',
      userId: createdById,
      summary: `Created series of ${created.length} reservations for ${created[0].room.name}`,
      metadata: {
        seriesId,
        count: created.length,
        frequency: dto.frequency,
        until: dto.until,
      },
    });

    return { seriesId, count: created.length, data: created };
  }

  async deleteFutureInSeries(id: string, actorId?: string) {
    const existing = await this.getReservationById(id);
    if (!existing.seriesId) {
      throw new BadRequestException('This reservation is not part of a series');
    }

    const result = await this.prismaService.reservation.updateMany({
      where: {
        seriesId: existing.seriesId,
        deletedAt: null,
        startAt: { gte: existing.startAt },
      },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: existing.seriesId,
      action: 'DELETE',
      userId: actorId,
      summary: `Deleted ${result.count} future series occurrences for ${existing.room.name}`,
      metadata: {
        seriesId: existing.seriesId,
        fromReservationId: id,
        deleted: result.count,
      },
    });

    return { deleted: result.count, seriesId: existing.seriesId };
  }

  async updateReservation(
    id: string,
    dto: UpdateReservationDto,
    actorId?: string,
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

    const professorId =
      dto.professorId !== undefined ? dto.professorId || null : existing.professorId;
    const status = dto.status ?? existing.status;
    await this.assertNoConflicts({
      roomId,
      professorId,
      startAt,
      endAt,
      excludeId: id,
      status,
    });

    const shouldRecalcPrice =
      dto.price === undefined &&
      (dto.roomId !== undefined || dto.startAt !== undefined || dto.endAt !== undefined);

    const updated = await this.prismaService.reservation.update({
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

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary: `Updated reservation for ${updated.room.name}`,
    });

    return updated;
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
    const startAtFilter: Prisma.DateTimeFilter | undefined =
      query.from || query.to
        ? {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lt: new Date(query.to) } : {}),
          }
        : undefined;

    const professorFilter: Prisma.ReservationWhereInput | undefined =
      query.professorId === 'none'
        ? { professorId: null }
        : query.professorId
          ? { professorId: query.professorId }
          : undefined;

    const andWhere = buildAndFilters<Prisma.ReservationWhereInput>(
      query.status ? { status: query.status } : undefined,
      query.roomId ? { roomId: query.roomId } : undefined,
      professorFilter,
      query.isPaid === 'true'
        ? { isPaid: true }
        : query.isPaid === 'false'
          ? { isPaid: false }
          : undefined,
      startAtFilter ? { startAt: startAtFilter } : undefined,
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

  async cancelReservation(id: string, actorId?: string) {
    await this.getReservationById(id);
    const cancelled = await this.prismaService.reservation.update({
      where: { id },
      data: { status: EReservationStatus.CANCELLED },
      include: reservationInclude,
    });

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: cancelled.id,
      action: 'CANCEL',
      userId: actorId,
      summary: `Cancelled reservation for ${cancelled.room.name}`,
    });

    return cancelled;
  }

  async deleteReservation(id: string, actorId?: string) {
    await this.getReservationById(id);
    const deleted = await this.prismaService.reservation.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: reservationInclude,
    });

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary: `Deleted reservation for ${deleted.room.name}`,
    });

    return deleted;
  }

  async bulkMarkPaid(ids: string[], actorId?: string) {
    const uniqueIds = Array.from(new Set(ids));
    const result = await this.prismaService.reservation.updateMany({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
        isPaid: false,
      },
      data: { isPaid: true },
    });

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: uniqueIds[0] ?? 'bulk',
      action: 'BULK_PAID',
      userId: actorId,
      summary: `Marked ${result.count} reservations as paid`,
      metadata: { ids: uniqueIds, updated: result.count },
    });

    return { updated: result.count };
  }

  private dayKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }

  private mapTodayProfessor(
    professor: {
      id: string;
      firstName: string;
      lastName: string;
    } | null,
  ) {
    if (!professor) return null;
    return {
      id: professor.id,
      firstName: professor.firstName,
      lastName: professor.lastName,
    };
  }

  async todaySnapshot() {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const [rooms, reservations] = await Promise.all([
      this.prismaService.room.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, capacity: true },
      }),
      this.prismaService.reservation.findMany({
        where: {
          deletedAt: null,
          status: EReservationStatus.CONFIRMED,
          startAt: { lt: dayEnd },
          endAt: { gt: dayStart },
        },
        include: {
          professor: {
            select: { id: true, firstName: true, lastName: true },
          },
          room: { select: { id: true, name: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    const byRoom = new Map<string, typeof reservations>();
    for (const reservation of reservations) {
      const list = byRoom.get(reservation.roomId) ?? [];
      list.push(reservation);
      byRoom.set(reservation.roomId, list);
    }

    const roomRows = rooms.map((room) => {
      const roomReservations = byRoom.get(room.id) ?? [];
      const current =
        roomReservations.find(
          (reservation) => reservation.startAt <= now && reservation.endAt > now,
        ) ?? null;
      const upcoming = roomReservations.filter(
        (reservation) => reservation.startAt > now,
      );
      const nextBusy = upcoming[0] ?? null;

      if (current) {
        return {
          roomId: room.id,
          roomName: room.name,
          capacity: room.capacity,
          status: 'OCCUPIED' as const,
          current: {
            reservationId: current.id,
            title: current.title,
            professor: this.mapTodayProfessor(current.professor),
            startAt: current.startAt.toISOString(),
            endAt: current.endAt.toISOString(),
            isPaid: current.isPaid,
          },
          nextFreeAt: current.endAt.toISOString(),
          freeUntil: null,
          nextBusy: nextBusy
            ? {
                reservationId: nextBusy.id,
                title: nextBusy.title,
                professor: this.mapTodayProfessor(nextBusy.professor),
                startAt: nextBusy.startAt.toISOString(),
                endAt: nextBusy.endAt.toISOString(),
              }
            : null,
        };
      }

      return {
        roomId: room.id,
        roomName: room.name,
        capacity: room.capacity,
        status: 'FREE' as const,
        current: null,
        nextFreeAt: null,
        freeUntil: nextBusy ? nextBusy.startAt.toISOString() : dayEnd.toISOString(),
        nextBusy: nextBusy
          ? {
              reservationId: nextBusy.id,
              title: nextBusy.title,
              professor: this.mapTodayProfessor(nextBusy.professor),
              startAt: nextBusy.startAt.toISOString(),
              endAt: nextBusy.endAt.toISOString(),
            }
          : null,
      };
    });

    const freeNow = roomRows
      .filter((row) => row.status === 'FREE')
      .map((row) => ({
        roomId: row.roomId,
        roomName: row.roomName,
        availableAt: now.toISOString(),
        freeUntil: row.freeUntil,
      }));

    const freeingSoon = roomRows
      .filter((row) => row.status === 'OCCUPIED' && row.nextFreeAt)
      .map((row) => ({
        roomId: row.roomId,
        roomName: row.roomName,
        availableAt: row.nextFreeAt as string,
        freeUntil: row.nextBusy?.startAt ?? dayEnd.toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(a.availableAt).getTime() - new Date(b.availableAt).getTime(),
      );

    const nextFreeSlots = [...freeNow, ...freeingSoon];

    const unpaidToday = reservations
      .filter((reservation) => !reservation.isPaid)
      .map((reservation) => {
        let timing: 'ONGOING' | 'STARTING' | 'LATER' | 'ENDED' = 'LATER';
        if (reservation.startAt <= now && reservation.endAt > now) {
          timing = 'ONGOING';
        } else if (reservation.endAt <= now) {
          timing = 'ENDED';
        } else if (reservation.startAt > now) {
          timing =
            this.dayKey(reservation.startAt) === this.dayKey(now)
              ? 'STARTING'
              : 'LATER';
        }

        return {
          id: reservation.id,
          title: reservation.title,
          room: {
            id: reservation.room.id,
            name: reservation.room.name,
          },
          professor: this.mapTodayProfessor(reservation.professor),
          startAt: reservation.startAt.toISOString(),
          endAt: reservation.endAt.toISOString(),
          price: Number(reservation.price),
          isPaid: reservation.isPaid,
          timing,
        };
      })
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );

    const occupiedCount = roomRows.filter((row) => row.status === 'OCCUPIED').length;

    return {
      asOf: now.toISOString(),
      day: {
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
      },
      counts: {
        roomsOccupied: occupiedCount,
        roomsFree: roomRows.length - occupiedCount,
        confirmedToday: reservations.length,
        unpaidToday: unpaidToday.length,
      },
      rooms: roomRows,
      nextFreeSlots,
      unpaidToday,
    };
  }

  async dashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const trendFrom = new Date(startOfDay);
    trendFrom.setDate(trendFrom.getDate() - 13);

    const [rooms, professors, todayReservations, monthReservations, trendReservations] =
      await Promise.all([
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
        this.prismaService.reservation.findMany({
          where: { deletedAt: null, startAt: { gte: startOfMonth, lt: startOfNextMonth } },
          select: {
            status: true,
            isPaid: true,
            price: true,
            roomId: true,
            room: { select: { name: true } },
          },
        }),
        this.prismaService.reservation.findMany({
          where: {
            deletedAt: null,
            status: EReservationStatus.CONFIRMED,
            startAt: { gte: trendFrom, lt: endOfDay },
          },
          select: { startAt: true, price: true },
        }),
      ]);

    const month = monthReservations.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.status === EReservationStatus.CONFIRMED) {
          acc.confirmed += 1;
          acc.revenue += Number(r.price);
        } else {
          acc.cancelled += 1;
        }
        if (r.isPaid) acc.paid += 1;
        else acc.unpaid += 1;
        return acc;
      },
      { total: 0, confirmed: 0, cancelled: 0, paid: 0, unpaid: 0, revenue: 0 },
    );
    month.revenue = Math.round(month.revenue * 100) / 100;

    const roomBuckets = new Map<
      string,
      { roomId: string; roomName: string; count: number; revenue: number }
    >();
    for (const r of monthReservations) {
      if (r.status !== EReservationStatus.CONFIRMED) continue;
      const bucket =
        roomBuckets.get(r.roomId) ??
        ({ roomId: r.roomId, roomName: r.room?.name ?? '—', count: 0, revenue: 0 } as const);
      roomBuckets.set(r.roomId, {
        ...bucket,
        count: bucket.count + 1,
        revenue: bucket.revenue + Number(r.price),
      });
    }
    const topRooms = Array.from(roomBuckets.values())
      .map((bucket) => ({ ...bucket, revenue: Math.round(bucket.revenue * 100) / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const trendMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(trendFrom);
      d.setDate(d.getDate() + i);
      trendMap.set(this.dayKey(d), { count: 0, revenue: 0 });
    }
    for (const r of trendReservations) {
      const bucket = trendMap.get(this.dayKey(r.startAt));
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += Number(r.price);
      }
    }
    const dailyTrend = Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      count: value.count,
      revenue: Math.round(value.revenue * 100) / 100,
    }));

    return { rooms, professors, todayReservations, month, topRooms, dailyTrend };
  }

  async occupancy(year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8–23

    const [rooms, reservations] = await Promise.all([
      this.prismaService.room.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prismaService.reservation.findMany({
        where: {
          deletedAt: null,
          status: EReservationStatus.CONFIRMED,
          startAt: { lt: to },
          endAt: { gt: from },
        },
        select: { roomId: true, startAt: true, endAt: true },
      }),
    ]);

    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: { roomId: string; hour: number; ratio: number; bookedMinutes: number }[] = [];

    for (const room of rooms) {
      for (const hour of hours) {
        let bookedMinutes = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const slotStart = new Date(y, m - 1, day, hour, 0, 0, 0);
          const slotEnd = new Date(y, m - 1, day, hour + 1, 0, 0, 0);
          if (slotEnd <= from || slotStart >= to) continue;

          for (const reservation of reservations) {
            if (reservation.roomId !== room.id) continue;
            const overlapStart = Math.max(slotStart.getTime(), reservation.startAt.getTime());
            const overlapEnd = Math.min(slotEnd.getTime(), reservation.endAt.getTime());
            if (overlapEnd > overlapStart) {
              bookedMinutes += (overlapEnd - overlapStart) / (1000 * 60);
            }
          }
        }
        const availableMinutes = daysInMonth * 60;
        cells.push({
          roomId: room.id,
          hour,
          bookedMinutes: Math.round(bookedMinutes),
          ratio: Math.min(1, Math.round((bookedMinutes / availableMinutes) * 1000) / 1000),
        });
      }
    }

    return { year: y, month: m, hours, rooms, cells };
  }
}

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
import { UnpaidSummaryQueryDto } from 'src/dto/reservation/unpaidSummaryQuery.dto';
import { CreateReservationSeriesDto } from 'src/dto/reservation/createReservationSeries.dto';
import { randomUUID } from 'crypto';
import {
  EReservationStatus,
  Prisma,
  Professor,
  Reservation,
  Room,
} from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { AuditService } from '../audit/audit.service';
import {
  formatAuditDate,
  formatAuditDateTime,
  formatAuditMoney,
  formatAuditTime,
  formatProfessorName,
  formatReservationLabel,
  formatReservationSlot,
} from 'src/common/utils/audit-format.util';

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

  private calculatePrice(
    room: Room,
    startAt: Date,
    endAt: Date,
    professor?: Pick<Professor, 'specialPrice'> | null,
  ): string {
    if (professor?.specialPrice != null) {
      return Number(professor.specialPrice).toFixed(2);
    }
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
    professor?: Pick<Professor, 'specialPrice'> | null,
  ): string {
    if (manualPrice !== undefined && manualPrice !== null && !Number.isNaN(Number(manualPrice))) {
      return Number(manualPrice).toFixed(2);
    }
    return this.calculatePrice(room, startAt, endAt, professor);
  }

  async availability(
    startAtInput: string,
    endAtInput: string,
    excludeReservationId?: string,
    preferredRoomId?: string,
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

    const preferred = preferredRoomId
      ? rooms.find((room) => room.id === preferredRoomId)
      : undefined;
    const preferredAvailable = Boolean(
      preferred && !busyRoomIds.has(preferred.id),
    );

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
      });

    if (preferred) {
      available.sort((a, b) => {
        const capacityDelta =
          Math.abs(a.capacity - preferred.capacity) -
          Math.abs(b.capacity - preferred.capacity);
        if (capacityDelta !== 0) return capacityDelta;
        return a.estimatedPrice - b.estimatedPrice || a.name.localeCompare(b.name);
      });
    } else {
      available.sort(
        (a, b) =>
          a.estimatedPrice - b.estimatedPrice || a.name.localeCompare(b.name),
      );
    }

    const alternatives = preferred
      ? available.filter((room) => room.id !== preferred.id)
      : available;

    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      preferredRoomId: preferred?.id ?? null,
      preferredAvailable: preferred ? preferredAvailable : null,
      rooms: available,
      alternatives,
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
    const professor = await this.assertProfessorExists(dto.professorId);
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
        price: this.resolvePrice(room, startAt, endAt, dto.price, professor),
        isPaid: dto.isPaid ?? false,
        paidAt: dto.isPaid ? new Date() : null,
        status,
        notes: dto.notes?.trim() || null,
        createdById: createdById || null,
      },
      include: reservationInclude,
    });

    const paymentLabel = created.isPaid
      ? `Payée le ${formatAuditDateTime(created.paidAt || new Date())}`
      : 'Non payée';
    const summary = `Réservation créée : ${formatProfessorName(created.professor)} · ${formatReservationLabel(created)} · Montant : ${formatAuditMoney(created.price)} · ${paymentLabel}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: created.id,
      action: 'CREATE',
      userId: createdById,
      summary,
      metadata: {
        reservationId: created.id,
        roomId: created.roomId,
        roomName: created.room.name,
        professorId: created.professorId,
        professorName: formatProfessorName(created.professor),
        startAt: created.startAt,
        endAt: created.endAt,
        price: Number(created.price),
        isPaid: created.isPaid,
        paidAt: created.paidAt,
        status: created.status,
        title: created.title,
      },
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
    const professor = await this.assertProfessorExists(dto.professorId);
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
              professor,
            ),
            isPaid: dto.isPaid ?? false,
            paidAt: dto.isPaid ? new Date() : null,
            status,
            notes: dto.notes?.trim() || null,
            seriesId,
            createdById: createdById || null,
          },
          include: reservationInclude,
        }),
      ),
    );

    const totalSeriesAmount = created.reduce((sum, r) => sum + Number(r.price), 0);
    const freqLabel = dto.frequency === 'WEEKLY' ? 'hebdomadaire' : 'mensuelle';
    const firstOcc = created[0];
    const seriesSummary = `Série de ${created.length} réservations créée (${freqLabel} jusqu'au ${formatAuditDate(dto.until)}) : ${formatProfessorName(firstOcc.professor)} · Salle ${firstOcc.room.name} [${formatAuditTime(firstOcc.startAt)} à ${formatAuditTime(firstOcc.endAt)}] · Total estimé : ${formatAuditMoney(totalSeriesAmount)}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: seriesId,
      action: 'SERIES_CREATE',
      userId: createdById,
      summary: seriesSummary,
      metadata: {
        seriesId,
        count: created.length,
        frequency: dto.frequency,
        until: dto.until,
        room: firstOcc.room.name,
        professor: formatProfessorName(firstOcc.professor),
        totalAmount: totalSeriesAmount,
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

    const deleteSeriesSummary = `Suppression de ${result.count} occurrence(s) future(s) de la série à partir du ${formatAuditDate(existing.startAt)} : ${formatProfessorName(existing.professor)} · Salle ${existing.room.name}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: existing.seriesId,
      action: 'DELETE',
      userId: actorId,
      summary: deleteSeriesSummary,
      metadata: {
        seriesId: existing.seriesId,
        fromReservationId: id,
        deleted: result.count,
        room: existing.room.name,
        professor: formatProfessorName(existing.professor),
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
    let professor: Pick<Professor, 'specialPrice'> | null =
      dto.professorId !== undefined
        ? await this.assertProfessorExists(dto.professorId)
        : existing.professor;
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
      (dto.roomId !== undefined ||
        dto.startAt !== undefined ||
        dto.endAt !== undefined ||
        dto.professorId !== undefined);

    if (shouldRecalcPrice && professorId && dto.professorId === undefined) {
      professor = await this.assertProfessorExists(professorId);
    }

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
          price: this.resolvePrice(room, startAt, endAt, dto.price, professor),
        }),
        ...(shouldRecalcPrice && {
          price: this.calculatePrice(room, startAt, endAt, professor),
        }),
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.isPaid === true && !existing.isPaid && { paidAt: new Date() }),
        ...(dto.isPaid === false && { paidAt: null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
      include: reservationInclude,
    });

    const changes: string[] = [];
    if (existing.roomId !== updated.roomId) {
      changes.push(`Salle : ${existing.room.name} ➔ ${updated.room.name}`);
    }
    if (existing.professorId !== updated.professorId) {
      changes.push(
        `Professeur : ${formatProfessorName(existing.professor)} ➔ ${formatProfessorName(updated.professor)}`,
      );
    }
    if (
      existing.startAt.getTime() !== updated.startAt.getTime() ||
      existing.endAt.getTime() !== updated.endAt.getTime()
    ) {
      changes.push(
        `Créneau : ${formatReservationSlot(existing.startAt, existing.endAt)} ➔ ${formatReservationSlot(updated.startAt, updated.endAt)}`,
      );
    }
    if (Number(existing.price) !== Number(updated.price)) {
      changes.push(
        `Montant : ${formatAuditMoney(existing.price)} ➔ ${formatAuditMoney(updated.price)}`,
      );
    }
    if (existing.status !== updated.status) {
      changes.push(`Statut : ${existing.status} ➔ ${updated.status}`);
    }
    if ((existing.title || '') !== (updated.title || '')) {
      changes.push(
        `Intitulé : "${existing.title || 'Sans titre'}" ➔ "${updated.title || 'Sans titre'}"`,
      );
    }

    let summary = '';
    const profLabel = formatProfessorName(updated.professor);
    const resLabel = formatReservationLabel(updated);
    const priceLabel = formatAuditMoney(updated.price);

    if (!existing.isPaid && updated.isPaid) {
      const paidDateLabel = formatAuditDateTime(updated.paidAt || new Date());
      summary = `Paiement validé : ${profLabel} · ${resLabel} · Montant : ${priceLabel} · Date de paiement : ${paidDateLabel}`;
      if (changes.length > 0) {
        summary += ` (Autres modifications : ${changes.join(', ')})`;
      }
    } else if (existing.isPaid && !updated.isPaid) {
      summary = `Paiement annulé (marquée non payée) : ${profLabel} · ${resLabel} · Montant : ${priceLabel}`;
      if (changes.length > 0) {
        summary += ` (Modifications : ${changes.join(', ')})`;
      }
    } else if (changes.length > 0) {
      summary = `Réservation modifiée [${changes.join(', ')}] : ${profLabel} · ${resLabel} · Montant : ${priceLabel} · ${updated.isPaid ? 'Payée' : 'Non payée'}`;
    } else {
      summary = `Réservation mise à jour : ${profLabel} · ${resLabel} · Montant : ${priceLabel} · ${updated.isPaid ? 'Payée' : 'Non payée'}`;
    }

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary,
      metadata: {
        reservationId: updated.id,
        roomId: updated.roomId,
        roomName: updated.room.name,
        professorId: updated.professorId,
        professorName: formatProfessorName(updated.professor),
        startAt: updated.startAt,
        endAt: updated.endAt,
        price: Number(updated.price),
        isPaid: updated.isPaid,
        paidAt: updated.paidAt,
        status: updated.status,
        title: updated.title,
        changes: changes.length > 0 ? changes : undefined,
      },
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

  async getUnpaidSummary(query: UnpaidSummaryQueryDto) {
    const { professorId } = query;
    const professorFilter: Prisma.ReservationWhereInput | undefined =
      professorId === 'none'
        ? { professorId: null }
        : professorId
          ? { professorId }
          : undefined;

    const baseWhere: Prisma.ReservationWhereInput = {
      deletedAt: null,
      status: EReservationStatus.CONFIRMED,
      ...professorFilter,
      ...(query.roomId ? { roomId: query.roomId } : {}),
      ...(query.from || query.to
        ? {
            startAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lt: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [unpaid, paid] = await Promise.all([
      this.prismaService.reservation.aggregate({
        where: { ...baseWhere, isPaid: false },
        _sum: { price: true },
        _count: true,
      }),
      this.prismaService.reservation.aggregate({
        where: { ...baseWhere, isPaid: true },
        _sum: { price: true },
        _count: true,
      }),
    ]);

    return {
      unpaidTotal: Number(unpaid._sum.price ?? 0),
      unpaidCount: unpaid._count,
      paidTotal: Number(paid._sum.price ?? 0),
      paidCount: paid._count,
    };
  }

  async getReservationTrend(months: number) {
    const now = new Date();
    const count = Math.min(Math.max(Math.trunc(months) || 6, 1), 24);
    const periods = Array.from({ length: count }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return {
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        start,
        end,
      };
    });

    return Promise.all(
      periods.map(async (period) => {
        const reservations = await this.prismaService.reservation.findMany({
          where: {
            deletedAt: null,
            status: EReservationStatus.CONFIRMED,
            startAt: { gte: period.start, lt: period.end },
          },
          select: { price: true, isPaid: true },
        });

        const revenue = reservations.reduce((sum, row) => sum + Number(row.price), 0);
        const paidRevenue = reservations
          .filter((row) => row.isPaid)
          .reduce((sum, row) => sum + Number(row.price), 0);

        return {
          year: period.year,
          month: period.month,
          count: reservations.length,
          revenue: Math.round(revenue * 100) / 100,
          paidRevenue: Math.round(paidRevenue * 100) / 100,
        };
      }),
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
        ...(query.professorId ? { professorId: query.professorId } : {}),
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

    const summary = `Réservation annulée : ${formatProfessorName(cancelled.professor)} · ${formatReservationLabel(cancelled)} · Montant : ${formatAuditMoney(cancelled.price)} · Statut paiement : ${cancelled.isPaid ? 'Payée' : 'Non payée'}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: cancelled.id,
      action: 'CANCEL',
      userId: actorId,
      summary,
      metadata: {
        reservationId: cancelled.id,
        room: cancelled.room.name,
        professor: formatProfessorName(cancelled.professor),
        startAt: cancelled.startAt,
        endAt: cancelled.endAt,
        price: Number(cancelled.price),
        isPaid: cancelled.isPaid,
      },
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

    const summary = `Réservation déplacée dans la corbeille : ${formatProfessorName(deleted.professor)} · ${formatReservationLabel(deleted)} · Montant : ${formatAuditMoney(deleted.price)}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary,
      metadata: {
        reservationId: deleted.id,
        room: deleted.room.name,
        professor: formatProfessorName(deleted.professor),
        startAt: deleted.startAt,
        endAt: deleted.endAt,
        price: Number(deleted.price),
      },
    });

    return deleted;
  }

  async getDeletedReservationById(id: string) {
    const reservation = await this.prismaService.reservation.findFirst({
      where: { id, deletedAt: { not: null } },
      include: reservationInclude,
    });
    if (!reservation) throw new NotFoundException('Deleted reservation not found');
    return reservation;
  }

  async listDeletedReservations(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.ReservationWhereInput,
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.reservation as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: { not: null } }, andWhere),
        include: reservationInclude,
        orderBy,
      },
      pagination,
    );
  }

  async restoreReservation(id: string, actorId?: string) {
    const existing = await this.getDeletedReservationById(id);
    await this.assertNoConflicts({
      roomId: existing.roomId,
      professorId: existing.professorId,
      startAt: existing.startAt,
      endAt: existing.endAt,
      status: existing.status,
    });

    const restored = await this.prismaService.reservation.update({
      where: { id },
      data: { deletedAt: null },
      include: reservationInclude,
    });

    const summary = `Réservation restaurée : ${formatProfessorName(restored.professor)} · ${formatReservationLabel(restored)} · Montant : ${formatAuditMoney(restored.price)} · ${restored.isPaid ? 'Payée' : 'Non payée'}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: restored.id,
      action: 'RESTORE',
      userId: actorId,
      summary,
      metadata: {
        reservationId: restored.id,
        room: restored.room.name,
        professor: formatProfessorName(restored.professor),
        startAt: restored.startAt,
        endAt: restored.endAt,
        price: Number(restored.price),
      },
    });

    return restored;
  }

  async hardDeleteReservation(id: string, actorId?: string) {
    const existing = await this.getDeletedReservationById(id);
    const removed = await this.prismaService.reservation.delete({
      where: { id },
      include: reservationInclude,
    });

    const summary = `Réservation supprimée définitivement : ${formatProfessorName(existing.professor)} · ${formatReservationLabel(existing)} · Montant : ${formatAuditMoney(existing.price)}`;

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: existing.id,
      action: 'HARD_DELETE',
      userId: actorId,
      summary,
      metadata: {
        reservationId: existing.id,
        room: existing.room.name,
        professor: formatProfessorName(existing.professor),
        startAt: existing.startAt,
        endAt: existing.endAt,
        price: Number(existing.price),
      },
    });

    return removed;
  }

  async bulkMarkPaid(ids: string[], actorId?: string) {
    const uniqueIds = Array.from(new Set(ids));
    const now = new Date();
    const targeted = await this.prismaService.reservation.findMany({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
        isPaid: false,
      },
      include: reservationInclude,
    });

    if (targeted.length === 0) {
      return { updated: 0 };
    }

    const result = await this.prismaService.reservation.updateMany({
      where: {
        id: { in: targeted.map((r) => r.id) },
        deletedAt: null,
        isPaid: false,
      },
      data: { isPaid: true, paidAt: now },
    });

    const paidDateLabel = formatAuditDateTime(now);
    const totalAmount = targeted.reduce((sum, r) => sum + Number(r.price), 0);

    let summary = '';
    if (targeted.length === 1) {
      const single = targeted[0];
      summary = `Paiement validé : ${formatProfessorName(single.professor)} · ${formatReservationLabel(single)} · Montant : ${formatAuditMoney(single.price)} · Date de paiement : ${paidDateLabel}`;
    } else {
      const itemsDetail = targeted
        .map(
          (r) =>
            `${formatProfessorName(r.professor)} (${r.room.name}, ${formatAuditDate(r.startAt)} : ${formatAuditMoney(r.price)})`,
        )
        .join(' ; ');
      const truncatedDetail =
        itemsDetail.length > 250 ? itemsDetail.slice(0, 247) + '...' : itemsDetail;
      summary = `Paiement groupé validé pour ${targeted.length} réservation(s) le ${paidDateLabel} (Total : ${formatAuditMoney(totalAmount)}) : ${truncatedDetail}`;
    }

    await this.auditService.log({
      entityType: 'RESERVATION',
      entityId: targeted[0]?.id ?? 'bulk',
      action: 'BULK_PAID',
      userId: actorId,
      summary,
      metadata: {
        count: result.count,
        totalAmount,
        paidAt: now,
        reservations: targeted.map((r) => ({
          id: r.id,
          professor: formatProfessorName(r.professor),
          room: r.room.name,
          startAt: r.startAt,
          endAt: r.endAt,
          price: Number(r.price),
        })),
      },
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

    const [rooms, professors, todayReservations, monthReservations, trendReservations, paidAggregate, unpaidAggregate, totalRevenueAggregate, allRooms, totalRoomRevenue] =
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
        this.prismaService.reservation.aggregate({
          where: {
            deletedAt: null,
            isPaid: true,
            status: EReservationStatus.CONFIRMED,
          },
          _sum: { price: true },
        }),
        this.prismaService.reservation.aggregate({
          where: {
            deletedAt: null,
            isPaid: false,
            status: EReservationStatus.CONFIRMED,
          },
          _sum: { price: true },
        }),
        this.prismaService.reservation.aggregate({
          where: {
            deletedAt: null,
            status: EReservationStatus.CONFIRMED,
          },
          _sum: { price: true },
        }),
        this.prismaService.room.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        this.prismaService.reservation.groupBy({
          by: ['roomId'],
          where: {
            deletedAt: null,
            status: EReservationStatus.CONFIRMED,
          },
          _sum: { price: true },
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
        if (r.isPaid) {
          acc.paid += 1;
          if (r.status === EReservationStatus.CONFIRMED) {
            acc.paidRevenue += Number(r.price);
          }
        } else {
          acc.unpaid += 1;
          if (r.status === EReservationStatus.CONFIRMED) {
            acc.unpaidRevenue += Number(r.price);
          }
        }
        return acc;
      },
      {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        paid: 0,
        unpaid: 0,
        revenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
      },
    );
    month.revenue = Math.round(month.revenue * 100) / 100;
    month.paidRevenue = Math.round(month.paidRevenue * 100) / 100;
    month.unpaidRevenue = Math.round(month.unpaidRevenue * 100) / 100;

    const monthRevenueByRoom = new Map<string, number>();
    for (const r of monthReservations) {
      if (r.status !== EReservationStatus.CONFIRMED) continue;
      monthRevenueByRoom.set(
        r.roomId,
        (monthRevenueByRoom.get(r.roomId) ?? 0) + Number(r.price),
      );
    }

    const totalRevenueByRoom = new Map(
      totalRoomRevenue.map((row) => [row.roomId, Number(row._sum.price ?? 0)]),
    );

    const topRooms = allRooms
      .map((room) => ({
        roomId: room.id,
        roomName: room.name,
        monthRevenue: Math.round((monthRevenueByRoom.get(room.id) ?? 0) * 100) / 100,
        totalRevenue: Math.round((totalRevenueByRoom.get(room.id) ?? 0) * 100) / 100,
      }))
      .sort(
        (a, b) =>
          b.monthRevenue - a.monthRevenue ||
          b.totalRevenue - a.totalRevenue ||
          a.roomName.localeCompare(b.roomName),
      );

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

    return {
      rooms,
      professors,
      todayReservations,
      month,
      topRooms,
      dailyTrend,
      totalPaid: Math.round(Number(paidAggregate._sum.price ?? 0) * 100) / 100,
      totalUnpaid: Math.round(Number(unpaidAggregate._sum.price ?? 0) * 100) / 100,
      totalRevenue: Math.round(Number(totalRevenueAggregate._sum.price ?? 0) * 100) / 100,
    };
  }
}

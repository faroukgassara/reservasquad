import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ENotificationType, EReservationStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatProfessorName, formatReservationSlot } from 'src/common/utils/audit-format.util';
import {
  FetchPortalReservationsDto,
  PortalBookDto,
  PortalRangeDto,
  PortalScheduleDto,
} from 'src/dto/portal/portal.dto';
import { ProfessorService } from '../professor/professor.service';
import { ReservationService } from '../reservation/reservation.service';
import { NotificationService } from '../notification/notification.service';

const MAX_BOOKING_HOURS = 12;
const MIN_BOOKING_MINUTES = 30;
// A month grid spans 6 full weeks.
const MAX_SCHEDULE_DAYS = 43;
const HOUR_MS = 60 * 60 * 1000;

const portalReservationSelect = {
  id: true,
  title: true,
  startAt: true,
  endAt: true,
  price: true,
  isPaid: true,
  paidAt: true,
  status: true,
  room: { select: { id: true, name: true } },
} satisfies Prisma.ReservationSelect;

type PortalReservationRow = Prisma.ReservationGetPayload<{ select: typeof portalReservationSelect }>;

function toPortalReservation(row: PortalReservationRow) {
  return { ...row, price: Number(row.price) };
}

function parseRange(startInput: string, endInput: string) {
  const startAt = new Date(startInput);
  const endAt = new Date(endInput);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new BadRequestException('Invalid time range');
  }
  return { startAt, endAt };
}

@Injectable()
export class PortalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly professorService: ProfessorService,
    private readonly reservationService: ReservationService,
    private readonly notificationService: NotificationService,
  ) {}

  private async resolveProfessor(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { professor: true },
    });
    if (!user?.professor || user.professor.deletedAt) {
      throw new ForbiddenException('No professor profile is linked to this account');
    }
    return user.professor;
  }

  private assertBookableRange(startAt: Date, endAt: Date) {
    if (startAt.getTime() < Date.now()) {
      throw new BadRequestException('You cannot book a slot in the past');
    }
    const durationMs = endAt.getTime() - startAt.getTime();
    if (durationMs < MIN_BOOKING_MINUTES * 60 * 1000) {
      throw new BadRequestException(`A booking must last at least ${MIN_BOOKING_MINUTES} minutes`);
    }
    if (durationMs > MAX_BOOKING_HOURS * HOUR_MS) {
      throw new BadRequestException(`A booking cannot exceed ${MAX_BOOKING_HOURS} hours`);
    }
  }

  async me(userId: string) {
    const professor = await this.resolveProfessor(userId);
    const [detail, upcoming] = await Promise.all([
      this.professorService.getProfessorDetail(professor.id),
      this.prismaService.reservation.findMany({
        where: {
          professorId: professor.id,
          deletedAt: null,
          status: EReservationStatus.CONFIRMED,
          endAt: { gte: new Date() },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        select: portalReservationSelect,
      }),
    ]);

    return {
      profile: {
        id: detail.id,
        firstName: detail.firstName,
        lastName: detail.lastName,
        email: detail.email,
        phone: detail.phone,
        specialty: detail.specialty,
      },
      balance: {
        unpaidTotal: detail.unpaidTotal,
        unpaidCount: detail.unpaidCount,
        paidTotal: detail.paidTotal,
        paidCount: detail.paidCount,
      },
      upcoming: upcoming.map(toPortalReservation),
    };
  }

  async rooms() {
    const rooms = await this.prismaService.room.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, capacity: true, pricePerHour: true, imageUrl: true },
    });
    return rooms.map((room) => ({ ...room, pricePerHour: Number(room.pricePerHour) }));
  }

  async availability(userId: string, dto: PortalRangeDto) {
    const professor = await this.resolveProfessor(userId);
    const { startAt, endAt } = parseRange(dto.startAt, dto.endAt);
    this.assertBookableRange(startAt, endAt);

    const result = await this.reservationService.availability(dto.startAt, dto.endAt);
    const specialPrice = professor.specialPrice != null ? Number(professor.specialPrice) : null;
    return {
      startAt: result.startAt,
      endAt: result.endAt,
      rooms: result.rooms.map((room) => ({
        ...room,
        estimatedPrice: specialPrice ?? room.estimatedPrice,
      })),
    };
  }

  /** Busy intervals per room, without revealing who booked them (except the professor's own). */
  async schedule(userId: string, dto: PortalScheduleDto) {
    const professor = await this.resolveProfessor(userId);
    const { startAt: from, endAt: to } = parseRange(dto.from, dto.to);
    if (to.getTime() - from.getTime() > MAX_SCHEDULE_DAYS * 24 * HOUR_MS) {
      throw new BadRequestException(`The schedule range cannot exceed ${MAX_SCHEDULE_DAYS} days`);
    }

    const [rooms, reservations] = await Promise.all([
      this.rooms(),
      this.prismaService.reservation.findMany({
        where: {
          deletedAt: null,
          status: EReservationStatus.CONFIRMED,
          startAt: { lt: to },
          endAt: { gt: from },
        },
        orderBy: { startAt: 'asc' },
        select: {
          id: true,
          roomId: true,
          startAt: true,
          endAt: true,
          professorId: true,
          title: true,
          price: true,
          isPaid: true,
        },
      }),
    ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      rooms: rooms.map((room) => ({
        ...room,
        busy: reservations
          .filter((reservation) => reservation.roomId === room.id)
          .map((reservation) => {
            const slot = { startAt: reservation.startAt, endAt: reservation.endAt };
            if (reservation.professorId !== professor.id) return { ...slot, mine: false };
            return {
              ...slot,
              mine: true,
              id: reservation.id,
              title: reservation.title,
              price: Number(reservation.price),
              isPaid: reservation.isPaid,
            };
          }),
      })),
    };
  }

  async book(userId: string, dto: PortalBookDto) {
    const professor = await this.resolveProfessor(userId);
    const { startAt, endAt } = parseRange(dto.startAt, dto.endAt);
    this.assertBookableRange(startAt, endAt);

    const created = await this.reservationService.createReservation(
      {
        roomId: dto.roomId,
        professorId: professor.id,
        startAt: dto.startAt,
        endAt: dto.endAt,
        title: dto.title,
        notes: dto.notes,
        status: EReservationStatus.CONFIRMED,
        isPaid: false,
      },
      userId,
    );

    const reservation = await this.prismaService.reservation.findUniqueOrThrow({
      where: { id: created.id },
      select: portalReservationSelect,
    });
    const professorName = formatProfessorName(professor);

    await this.notificationService.notifyStaff({
      type: ENotificationType.PROFESSOR_RESERVATION_CREATED,
      title: `Nouvelle réservation de ${professorName}`,
      body: `${reservation.room.name} · ${formatReservationSlot(reservation.startAt, reservation.endAt)}`,
      data: {
        reservationId: reservation.id,
        professorId: professor.id,
        professorName,
        roomId: reservation.room.id,
        roomName: reservation.room.name,
        startAt: reservation.startAt.toISOString(),
        endAt: reservation.endAt.toISOString(),
        price: Number(reservation.price),
      },
    });

    return toPortalReservation(reservation);
  }

  async reservations(userId: string, query: FetchPortalReservationsDto) {
    const professor = await this.resolveProfessor(userId);
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const now = new Date();

    const where: Prisma.ReservationWhereInput = {
      professorId: professor.id,
      deletedAt: null,
      ...(query.scope === 'upcoming' && { endAt: { gte: now } }),
      ...(query.scope === 'past' && { endAt: { lt: now } }),
    };

    const [rows, total] = await Promise.all([
      this.prismaService.reservation.findMany({
        where,
        orderBy: { startAt: query.scope === 'upcoming' ? 'asc' : 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: portalReservationSelect,
      }),
      this.prismaService.reservation.count({ where }),
    ]);

    return { data: rows.map(toPortalReservation), meta: { total, page, perPage } };
  }
}

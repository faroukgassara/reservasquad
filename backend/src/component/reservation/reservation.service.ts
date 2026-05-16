import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, Role, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookReservationDto } from 'src/dto/reservation/book-reservation.dto';
import { CreateReservationDto } from 'src/dto/reservation/create-reservation.dto';
import { UpdateReservationDto } from 'src/dto/reservation/update-reservation.dto';
import { ListReservationsQueryDto } from 'src/dto/reservation/list-reservations-query.dto';
import {
  assertBookingWindow,
  DAY_END_EXCLUSIVE_MINUTES,
  minutesToLabel,
  timeLabelToMinutes,
} from './reservation-time.util';
import {
  prismaDecimalLikeToNumber,
  reservationPriceDecimal,
  resolveReservationPriceTnd,
} from './reservation-price.util';

interface IAuthUser {
  id: string;
  role: string;
}

const selectReservation = {
  id: true,
  userId: true,
  roomId: true,
  date: true,
  startMinutes: true,
  endMinutes: true,
  numberOfPeople: true,
  purpose: true,
  status: true,
  price: true,
  priceMode: true,
  paid: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  room: true,
};

export function localIsoDateFromParts(utcYear: number, utcMonthZero: number, utcDay: number): string {
  const m = String(utcMonthZero + 1).padStart(2, '0');
  const day = String(utcDay).padStart(2, '0');
  return `${utcYear}-${m}-${day}`;
}

function localIsoCalendarDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDayOnly(day: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
  return new Date(`${day}T00:00:00.000Z`);
}

type ReservationSelected = Prisma.ReservationGetPayload<{
  select: typeof selectReservation;
}>;

type EnrichedRoom = Omit<ReservationSelected['room'], 'pricePerHour'> & {
  pricePerHour: number;
};

type EnrichedReservation = Omit<ReservationSelected, 'price' | 'room'> & {
  startTime: string;
  endTime: string;
  price: number;
  room: EnrichedRoom;
};

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async calendar(year: number, month: number) {
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      throw new BadRequestException('year and valid month required');
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const from = `${year}-${pad(month)}-01`;
    const lastNum = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const to = `${year}-${pad(month)}-${String(lastNum).padStart(2, '0')}`;

    const rows = await this.prisma.reservation.findMany({
      where: {
        date: {
          gte: parseDayOnly(from),
          lte: parseDayOnly(to),
        },
      },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
      select: selectReservation,
    });

    const byDay: Record<string, EnrichedReservation[]> = {};
    for (const r of rows) {
      const ud = new Date(r.date);
      const key = localIsoDateFromParts(ud.getUTCFullYear(), ud.getUTCMonth(), ud.getUTCDate());
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(this.enrichRow(r));
    }

    return { from, to, byDay };
  }

  private enrichRow(r: ReservationSelected): EnrichedReservation {
    const { price: priceRaw, room, ...rest } = r;
    return {
      ...rest,
      price: prismaDecimalLikeToNumber(priceRaw),
      room: {
        ...room,
        pricePerHour: prismaDecimalLikeToNumber(room.pricePerHour),
      },
      startTime: minutesToLabel(r.startMinutes),
      endTime: minutesToLabel(r.endMinutes),
    };
  }

  async list(q: ListReservationsQueryDto) {
    const where: Prisma.ReservationWhereInput = {};

    if (q.userId) where.userId = q.userId;
    if (q.roomId) where.roomId = q.roomId;
    if (q.status) where.status = q.status;
    if (q.date) where.date = parseDayOnly(q.date.slice(0, 10));

    const range: Prisma.DateTimeFilter = {};
    let hasRange = false;
    if (q.dateFrom) {
      range.gte = parseDayOnly(q.dateFrom.slice(0, 10));
      hasRange = true;
    }
    if (q.dateTo) {
      range.lte = parseDayOnly(q.dateTo.slice(0, 10));
      hasRange = true;
    }
    if (hasRange) where.date = range;

    const rows = await this.prisma.reservation.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
      select: selectReservation,
    });

    return rows.map((r) => this.enrichRow(r));
  }

  async createPublicBooking(dto: BookReservationDto) {
    const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherUserId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException('Invalid teacher.');
    }

    const day = dto.date.slice(0, 10);
    const today = localIsoCalendarDate(new Date());
    if (day < today) {
      throw new BadRequestException('You cannot reserve a slot in the past.');
    }

    const startM = timeLabelToMinutes(dto.startTime, 'start');
    const endM = timeLabelToMinutes(dto.endTime, 'end');
    assertBookingWindow(startM, endM);
    if (endM === DAY_END_EXCLUSIVE_MINUTES && dto.endTime.trim() !== '00:00') {
      throw new BadRequestException('Invalid end time.');
    }

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    if (dto.numberOfPeople > room.capacity) {
      throw new BadRequestException(`This room accepts at most ${room.capacity} people.`);
    }

    await this.assertNoOverlap(dto.roomId, day, startM, endM, undefined);

    const resolvedPrice = resolveReservationPriceTnd({
      mode: dto.priceMode,
      roomPricePerHour: room.pricePerHour,
      startMinutes: startM,
      endMinutes: endM,
      numberOfPeople: dto.numberOfPeople,
      manualPrice: dto.manualPrice,
    });

    const created = await this.prisma.reservation.create({
      data: {
        userId: teacher.id,
        roomId: dto.roomId,
        date: parseDayOnly(day),
        startMinutes: startM,
        endMinutes: endM,
        numberOfPeople: dto.numberOfPeople,
        purpose: dto.purpose.trim(),
        status: ReservationStatus.PENDING,
        priceMode: dto.priceMode,
        price: reservationPriceDecimal(resolvedPrice),
      },
      select: selectReservation,
    });
    return this.enrichRow(created);
  }

  async adminCreateForTeacher(
    dto: CreateReservationDto & { teacherUserId: string },
    acting: IAuthUser,
  ) {
    if (acting.role !== Role.ADMIN) throw new ForbiddenException();
    const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherUserId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException('Invalid teacher user.');
    }
    const day = dto.date.slice(0, 10);
    const startM = timeLabelToMinutes(dto.startTime, 'start');
    const endM = timeLabelToMinutes(dto.endTime, 'end');
    assertBookingWindow(startM, endM);

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    if (dto.numberOfPeople > room.capacity) {
      throw new BadRequestException(`This room accepts at most ${room.capacity} people.`);
    }

    await this.assertNoOverlap(dto.roomId, day, startM, endM, undefined);

    const resolvedPrice = resolveReservationPriceTnd({
      mode: dto.priceMode,
      roomPricePerHour: room.pricePerHour,
      startMinutes: startM,
      endMinutes: endM,
      numberOfPeople: dto.numberOfPeople,
      manualPrice: dto.manualPrice,
    });

    const created = await this.prisma.reservation.create({
      data: {
        userId: dto.teacherUserId,
        roomId: dto.roomId,
        date: parseDayOnly(day),
        startMinutes: startM,
        endMinutes: endM,
        numberOfPeople: dto.numberOfPeople,
        purpose: dto.purpose,
        status: ReservationStatus.CONFIRMED,
        priceMode: dto.priceMode,
        price: reservationPriceDecimal(resolvedPrice),
      },
      select: selectReservation,
    });
    return this.enrichRow(created);
  }

  private async assertNoOverlap(
    roomId: string,
    day: string,
    startM: number,
    endM: number,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.reservation.findFirst({
      where: {
        roomId,
        date: parseDayOnly(day),
        status: { not: ReservationStatus.CANCELLED },
        id: excludeId ? { not: excludeId } : undefined,
        AND: [{ startMinutes: { lt: endM } }, { endMinutes: { gt: startM } }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This room is already reserved for overlapping hours on this date.',
      );
    }
  }

  async updateReservation(id: string, dto: UpdateReservationDto) {
    const found = await this.prisma.reservation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Reservation not found');

    const data: Prisma.ReservationUpdateInput = {};

    if (dto.status !== undefined) {
      if (dto.status !== ReservationStatus.CONFIRMED && dto.status !== ReservationStatus.CANCELLED) {
        throw new BadRequestException('Invalid status.');
      }
      data.status = dto.status;
    }

    if (dto.paid !== undefined) {
      data.paid = dto.paid;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data,
      select: selectReservation,
    });
    return this.enrichRow(updated);
  }
}

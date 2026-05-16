import { BadRequestException } from '@nestjs/common';
import { Prisma, ReservationPriceMode } from 'src/generated/prisma/client';

export const PER_PARTICIPANT_TND_RATE = 2.5;

export function roundMoneyTnd(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Duration between slot boundaries in fractional hours */
export function bookingDurationHours(startM: number, endM: number): number {
  return (endM - startM) / 60;
}

export function reservationPriceDecimal(resolvedTnd: number): Prisma.Decimal {
  return new Prisma.Decimal(roundMoneyTnd(resolvedTnd));
}

export function prismaDecimalLikeToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as Prisma.Decimal).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function resolveReservationPriceTnd(opts: {
  mode: ReservationPriceMode;
  roomPricePerHour: Prisma.Decimal | number | string;
  startMinutes: number;
  endMinutes: number;
  numberOfPeople: number;
  manualPrice?: number;
}): number {
  switch (opts.mode) {
    case ReservationPriceMode.ROOM_HOURLY: {
      const pph = Number(opts.roomPricePerHour);
      if (Number.isNaN(pph) || pph < 0) {
        throw new BadRequestException('Invalid room hourly price.');
      }
      const hrs = bookingDurationHours(opts.startMinutes, opts.endMinutes);
      return roundMoneyTnd(pph * hrs);
    }
    case ReservationPriceMode.PER_PARTICIPANT:
      return roundMoneyTnd(opts.numberOfPeople * PER_PARTICIPANT_TND_RATE);
    case ReservationPriceMode.MANUAL: {
      const raw = opts.manualPrice;
      if (raw === undefined || raw === null || Number.isNaN(Number(raw))) {
        throw new BadRequestException('manualPrice is required when price mode is MANUAL.');
      }
      const n = Number(raw);
      if (n < 0) throw new BadRequestException('manualPrice must be zero or positive.');
      return roundMoneyTnd(n);
    }
    default:
      throw new BadRequestException('Unsupported price mode.');
  }
}

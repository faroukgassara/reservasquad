import { BadRequestException } from '@nestjs/common';

export const SLOT_STEP_MINUTES = 30;
/** 08:00 */
export const FIRST_BOOKABLE_MINUTES = 8 * 60;
/** End-of-day sentinel for "24:00" displayed as 00:00 */
export const DAY_END_EXCLUSIVE_MINUTES = 24 * 60;

export function timeLabelToMinutes(label: string, kind: 'start' | 'end'): number {
  const parts = label.trim().split(':');
  if (parts.length !== 2) {
    throw new BadRequestException('Invalid time format. Use HH:mm.');
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    throw new BadRequestException('Invalid time.');
  }
  if (kind === 'end' && h === 0 && m === 0) {
    return DAY_END_EXCLUSIVE_MINUTES;
  }
  return h * 60 + m;
}

export function minutesToLabel(m: number): string {
  if (m >= DAY_END_EXCLUSIVE_MINUTES) return '00:00';
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

export function assertBookingWindow(startM: number, endM: number): void {
  if (startM % SLOT_STEP_MINUTES !== 0 || endM % SLOT_STEP_MINUTES !== 0) {
    throw new BadRequestException(`Times must be in ${SLOT_STEP_MINUTES}-minute steps.`);
  }
  if (startM < FIRST_BOOKABLE_MINUTES || startM > DAY_END_EXCLUSIVE_MINUTES - SLOT_STEP_MINUTES) {
    throw new BadRequestException('Start time must be between 08:00 and 23:30.');
  }
  if (endM <= FIRST_BOOKABLE_MINUTES || endM > DAY_END_EXCLUSIVE_MINUTES) {
    throw new BadRequestException('End time must be after 08:00 and at most midnight (00:00).');
  }
  if (endM <= startM) {
    throw new BadRequestException('End time must be after start time.');
  }
}

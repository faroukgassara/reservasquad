import type { ReservationRecord } from '@/lib/reservation-api';

export type CalendarColorBy = 'payment' | 'room' | 'professor';

export interface CalendarAccent {
    borderClass: string;
    dotClass: string;
    swatchClass: string;
    label: string;
}

const ENTITY_PALETTE = [
    { borderClass: 'border-s-primary-500', dotClass: 'bg-primary-500', swatchClass: 'bg-primary-500' },
    { borderClass: 'border-s-accent-500', dotClass: 'bg-accent-500', swatchClass: 'bg-accent-500' },
    { borderClass: 'border-s-success-500', dotClass: 'bg-success-500', swatchClass: 'bg-success-500' },
    { borderClass: 'border-s-warning-500', dotClass: 'bg-warning-500', swatchClass: 'bg-warning-500' },
    { borderClass: 'border-s-danger-500', dotClass: 'bg-danger-500', swatchClass: 'bg-danger-500' },
    { borderClass: 'border-s-primary-300', dotClass: 'bg-primary-300', swatchClass: 'bg-primary-300' },
    { borderClass: 'border-s-accent-300', dotClass: 'bg-accent-300', swatchClass: 'bg-accent-300' },
    { borderClass: 'border-s-success-300', dotClass: 'bg-success-300', swatchClass: 'bg-success-300' },
] as const;

function hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function paletteFor(id: string) {
    return ENTITY_PALETTE[hashId(id) % ENTITY_PALETTE.length];
}

export function getEventAccent(
    event: ReservationRecord,
    colorBy: CalendarColorBy,
    labels: { paid: string; unpaid: string; noProfessor: string },
): CalendarAccent {
    if (colorBy === 'payment') {
        if (event.isPaid) {
            return {
                borderClass: 'border-s-success-400',
                dotClass: 'bg-success-400',
                swatchClass: 'bg-success-400',
                label: labels.paid,
            };
        }
        return {
            borderClass: 'border-s-warning-400',
            dotClass: 'bg-warning-400',
            swatchClass: 'bg-warning-400',
            label: labels.unpaid,
        };
    }

    if (colorBy === 'room') {
        const palette = paletteFor(event.roomId);
        return {
            ...palette,
            label: event.room?.name ?? event.roomId,
        };
    }

    if (!event.professorId || !event.professor) {
        return {
            borderClass: 'border-s-gray-300',
            dotClass: 'bg-gray-300',
            swatchClass: 'bg-gray-300',
            label: labels.noProfessor,
        };
    }

    const palette = paletteFor(event.professorId);
    return {
        ...palette,
        label: `${event.professor.firstName} ${event.professor.lastName}`.trim(),
    };
}

export function buildColorLegend(
    events: ReservationRecord[],
    colorBy: CalendarColorBy,
    labels: { paid: string; unpaid: string; noProfessor: string },
): CalendarAccent[] {
    if (colorBy === 'payment') {
        return [
            {
                borderClass: 'border-s-success-400',
                dotClass: 'bg-success-400',
                swatchClass: 'bg-success-400',
                label: labels.paid,
            },
            {
                borderClass: 'border-s-warning-400',
                dotClass: 'bg-warning-400',
                swatchClass: 'bg-warning-400',
                label: labels.unpaid,
            },
        ];
    }

    const seen = new Map<string, CalendarAccent>();
    for (const event of events) {
        const accent = getEventAccent(event, colorBy, labels);
        const key =
            colorBy === 'room'
                ? event.roomId
                : event.professorId ?? '__none__';
        if (!seen.has(key)) seen.set(key, accent);
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function moveReservationToDay(
    event: ReservationRecord,
    targetDay: Date,
): { startAt: string; endAt: string } | null {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    if (start.toDateString() === targetDay.toDateString()) return null;

    const durationMs = end.getTime() - start.getTime();
    const nextStart = new Date(targetDay);
    nextStart.setHours(
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds(),
    );
    const nextEnd = new Date(nextStart.getTime() + durationMs);
    return {
        startAt: nextStart.toISOString(),
        endAt: nextEnd.toISOString(),
    };
}

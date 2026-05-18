import type { CalendarReservation, CalendarViewMode } from '@/types/calendar';
import {
    addDays,
    addMonths,
    addWeeks,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export function reservationStatusPillClass(status: CalendarReservation['status']): string {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-900';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
}

export function calendarApiIsoRange(view: CalendarViewMode, cursor: Date): { from: string; to: string } {
    if (view === 'month') {
        const start = startOfMonth(cursor);
        const end = endOfMonth(cursor);
        return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
    }
    if (view === 'week') {
        const start = startOfWeek(cursor, { weekStartsOn: 1 });
        const end = endOfWeek(cursor, { weekStartsOn: 1 });
        return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
    }
    const d = format(cursor, 'yyyy-MM-dd');
    return { from: d, to: d };
}

export function navigateCalendarCursor(view: CalendarViewMode, cursor: Date, direction: -1 | 1): Date {
    if (view === 'month') return addMonths(cursor, direction);
    if (view === 'week') return addWeeks(cursor, direction);
    return addDays(cursor, direction);
}

export function weekIntervalFromCursor(cursor: Date): Date[] {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
}

export function formatCalendarPeriodTitle(view: CalendarViewMode, cursor: Date): string {
    if (view === 'month') return format(cursor, 'MMMM yyyy', { locale: fr });
    if (view === 'week') {
        const start = startOfWeek(cursor, { weekStartsOn: 1 });
        const end = endOfWeek(cursor, { weekStartsOn: 1 });
        return `${format(start, 'd MMM', { locale: fr })} — ${format(end, 'd MMM yyyy', { locale: fr })}`;
    }
    return format(cursor, 'EEEE d MMMM yyyy', { locale: fr });
}
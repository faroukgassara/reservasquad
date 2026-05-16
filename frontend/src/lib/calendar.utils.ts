import type { CalendarReservation } from '@/types/calendar';

export function reservationStatusPillClass(status: CalendarReservation['status']): string {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-900';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-900';
    return 'bg-red-100 text-red-900';
}

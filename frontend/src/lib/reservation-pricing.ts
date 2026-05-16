import { timeToMinutes } from '@/lib/time-slots';

export type ReservationPriceMode = 'ROOM_HOURLY' | 'PER_PARTICIPANT' | 'MANUAL';

export const PER_PARTICIPANT_TND_MULTIPLIER = 2.5;

export const RESERVATION_PRICE_MODE_OPTIONS: { value: ReservationPriceMode; label: string }[] = [
    { value: 'ROOM_HOURLY', label: 'Salle × durée (tarif horaire)' },
    { value: 'PER_PARTICIPANT', label: 'Participants × 2,5 TND' },
    { value: 'MANUAL', label: 'Prix manuel' },
];

export function formatTnd(amount: number): string {
    return amount.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function reservationPriceModeCaptionFr(mode: ReservationPriceMode): string {
    if (mode === 'ROOM_HOURLY') return 'Tarif horaire salle';
    if (mode === 'PER_PARTICIPANT') return 'Participants × 2,5';
    return 'Manuel';
}

function roundTnd(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function reservationDurationHoursFromLabels(start: string, end: string): number {
    return (timeToMinutes(end, 'end') - timeToMinutes(start, 'start')) / 60;
}

/** Client-side preview aligned with backend resolution (rounded to 2 dp). */
export function previewReservationTotalTnd(input: {
    mode: ReservationPriceMode;
    pricePerHour: number;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    manualPrice: number;
}): number {
    switch (input.mode) {
        case 'ROOM_HOURLY':
            return roundTnd(input.pricePerHour * reservationDurationHoursFromLabels(input.startTime, input.endTime));
        case 'PER_PARTICIPANT':
            return roundTnd(input.numberOfPeople * PER_PARTICIPANT_TND_MULTIPLIER);
        case 'MANUAL':
            return roundTnd(Number.isFinite(input.manualPrice) ? input.manualPrice : 0);
        default:
            return 0;
    }
}

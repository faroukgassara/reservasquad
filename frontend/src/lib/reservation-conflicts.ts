import type { useTranslations } from 'next-intl';

type ReservationsT = ReturnType<typeof useTranslations<'admin.reservations'>>;

/** Map Nest ConflictException messages to localized reservation conflict copy. */
export function mapReservationConflictMessage(message: string, t: ReservationsT): string {
    if (message === 'This room is already reserved for the selected time range') {
        return t('conflicts.room');
    }
    if (message === 'This professor is already booked for the selected time range') {
        return t('conflicts.professor');
    }

    const roomOn = /^This room is already reserved on (.+)$/.exec(message);
    if (roomOn?.[1]) {
        return t('conflicts.roomOn', { at: formatConflictAt(roomOn[1]) });
    }

    const professorOn = /^This professor is already booked on (.+)$/.exec(message);
    if (professorOn?.[1]) {
        return t('conflicts.professorOn', { at: formatConflictAt(professorOn[1]) });
    }

    return message;
}

function formatConflictAt(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

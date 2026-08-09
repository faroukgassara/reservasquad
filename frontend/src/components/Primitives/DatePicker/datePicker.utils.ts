import { EInputStatus } from '@/Enum/Enum';

export function resolveInputStatus(error?: boolean, status?: EInputStatus): EInputStatus {
    if (error) return EInputStatus.error;
    return status ?? EInputStatus.default;
}

export function hasDateValue(value?: string): boolean {
    return value !== undefined && value.length > 0;
}

export function parseDateValue(value?: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

export function formatDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDateDisplay(value?: string): string {
    const date = parseDateValue(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
    );
}

export function isSameMonth(date: Date, month: Date): boolean {
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

export const WEEKDAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] as const;

export function getMonthStartWeekday(year: number, month: number): number {
    const weekday = new Date(year, month, 1).getDay();
    return weekday === 0 ? 6 : weekday - 1;
}

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function buildCalendarDays(viewDate: Date): Array<{ date: Date; inCurrentMonth: boolean }> {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const leadingEmpty = getMonthStartWeekday(year, month);
    const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

    for (let index = 0; index < leadingEmpty; index += 1) {
        const date = new Date(year, month, index - leadingEmpty + 1);
        cells.push({ date, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
        const lastDate = cells[cells.length - 1].date;
        const date = new Date(lastDate);
        date.setDate(date.getDate() + 1);
        cells.push({ date, inCurrentMonth: false });
    }

    return cells;
}

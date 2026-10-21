/**
 * Date helper utilities extracted from export-weekly-calendar-pdf
 * to avoid pulling jspdf and heavy PDF libraries into non-PDF pages (calendar, portal booking, etc.).
 */

export function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function startOfWeek(date: Date): Date {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function startOfMonth(date: Date): Date {
    const d = startOfDay(date);
    d.setDate(1);
    return d;
}

export function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

export function toIsoDateKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTime(iso: string, locale: string): string {
    return new Date(iso).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatDayLabel(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function formatWeekdayShort(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, { weekday: 'short' });
}

export function formatDayMonth(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function formatMonthLabel(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
    });
}

export function monthNames(locale: string): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2024, i, 1)));
}


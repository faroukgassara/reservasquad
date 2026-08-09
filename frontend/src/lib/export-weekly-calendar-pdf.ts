import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReservationRecord } from '@/lib/reservation-api';
import type { RoomRecord } from '@/lib/room-api';

export interface WeeklyCalendarPdfLabels {
    /** e.g. "Du {from} au {to}" */
    weekRange: string;
    empty: string;
}

const DAY_NAMES = [
    'LUNDI',
    'MARDI',
    'MERCREDI',
    'JEUDI',
    'VENDREDI',
    'SAMEDI',
    'DIMANCHE',
] as const;

/** Hour slots: start hour of each 1h block (8 → 8h-9h, …, 23 → 23h-00h) */
const MORNING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15] as const;
const EVENING_HOURS = [16, 17, 18, 19, 20, 21, 22, 23] as const;

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfWeek(date: Date): Date {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDateDdMmYyyy(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function hourSlotLabel(startHour: number): string {
    const endHour = (startHour + 1) % 24;
    return `${startHour}h-${endHour}h`;
}

function fileDateStamp(weekStart: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;
}

function slugify(value: string): string {
    return (
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase() || 'salle'
    );
}

function reservationLabel(event: ReservationRecord): string {
    if (event.professor) {
        return `${event.professor.firstName} ${event.professor.lastName}`.trim();
    }
    if (event.title?.trim()) return event.title.trim();
    return 'Réservé';
}

/** True if reservation overlaps [hour, hour+1) on the given calendar day. */
function overlapsHourSlot(event: ReservationRecord, day: Date, hour: number): boolean {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return start < slotEnd && end > slotStart;
}

function cellForSlot(
    roomEvents: ReservationRecord[],
    day: Date,
    hour: number,
): string {
    const matches = roomEvents.filter((event) => overlapsHourSlot(event, day, hour));
    if (matches.length === 0) return '';
    return matches.map(reservationLabel).join('\n');
}

function buildTableBody(
    days: Date[],
    roomEvents: ReservationRecord[],
    hours: readonly number[],
): string[][] {
    return days.map((day, index) => [
        DAY_NAMES[index],
        ...hours.map((hour) => cellForSlot(roomEvents, day, hour)),
    ]);
}

function drawHourGrid(
    doc: jsPDF,
    startY: number,
    days: Date[],
    roomEvents: ReservationRecord[],
    hours: readonly number[],
): number {
    const head = ['', ...hours.map(hourSlotLabel)];
    const body = buildTableBody(days, roomEvents, hours);

    autoTable(doc, {
        startY,
        head: [head],
        body,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            valign: 'middle',
            halign: 'center',
            overflow: 'linebreak',
            minCellHeight: 11,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            fillColor: [255, 255, 255],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
        },
        columnStyles: {
            0: {
                cellWidth: 28,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
        },
        margin: { left: 12, right: 12 },
        tableWidth: 'auto',
    });

    const finalY =
        (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
        startY + 90;
    return finalY;
}

/**
 * Portrait A4 weekly room schedule matching the Biblio Squad grid template:
 * room title + "Du … au …", then two hour grids (8h–16h and 16h–00h).
 */
export function exportWeeklyCalendarPdf(params: {
    anchor: Date;
    rooms: RoomRecord[];
    events: ReservationRecord[];
    labels: WeeklyCalendarPdfLabels;
}): void {
    const { rooms, events, labels } = params;
    if (rooms.length === 0) return;

    const weekStart = startOfWeek(params.anchor);
    const weekEnd = addDays(weekStart, 6);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const rangeText = labels.weekRange
        .replace('{from}', formatDateDdMmYyyy(weekStart))
        .replace('{to}', formatDateDdMmYyyy(weekEnd));

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    rooms.forEach((room, roomIndex) => {
        if (roomIndex > 0) doc.addPage();

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(room.name, pageWidth / 2, 18, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(rangeText, pageWidth / 2, 26, { align: 'center' });

        const roomEvents = events.filter((event) => event.roomId === room.id);

        const afterMorning = drawHourGrid(doc, 32, days, roomEvents, MORNING_HOURS);
        drawHourGrid(doc, afterMorning + 8, days, roomEvents, EVENING_HOURS);
    });

    const roomPart =
        rooms.length === 1 ? slugify(rooms[0].name) : `${rooms.length}-salles`;
    doc.save(`calendrier-semaine-${fileDateStamp(weekStart)}-${roomPart}.pdf`);
}

export { startOfWeek, addDays, startOfDay };

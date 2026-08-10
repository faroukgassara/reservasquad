import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReservationRecord } from '@/lib/reservation-api';
import type { RoomRecord } from '@/lib/room-api';

export interface WeeklyCalendarPdfLabels {
    title: string;
    weekRange: string;
    morningSection: string;
    eveningSection: string;
    empty: string;
}

/** Biblio Squad theme — primary navy #253165 */
const PRIMARY: [number, number, number] = [37, 49, 101];
const PRIMARY_LIGHT: [number, number, number] = [237, 240, 247];
const ACCENT: [number, number, number] = [228, 25, 29];
const GRAY_900: [number, number, number] = [33, 37, 46];
const GRAY_600: [number, number, number] = [74, 79, 92];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_100: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];
const STRIPE: [number, number, number] = [249, 250, 251];

const MARGIN = 14;
const HEADER_HEIGHT = 32;

const DAY_NAMES = [
    'LUNDI',
    'MARDI',
    'MERCREDI',
    'JEUDI',
    'VENDREDI',
    'SAMEDI',
    'DIMANCHE',
] as const;

const MORNING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15] as const;
const EVENING_HOURS = [16, 17, 18, 19, 20, 21, 22, 23] as const;

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

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

function lastTableY(doc: DocWithAutoTable, fallback: number): number {
    return doc.lastAutoTable?.finalY ?? fallback;
}

function reservationLabel(event: ReservationRecord): string {
    if (event.professor) {
        return `${event.professor.firstName} ${event.professor.lastName}`.trim();
    }
    if (event.title?.trim()) return event.title.trim();
    return 'Réservé';
}

function overlapsHourSlot(event: ReservationRecord, day: Date, hour: number): boolean {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return start < slotEnd && end > slotStart;
}

function cellForSlot(roomEvents: ReservationRecord[], day: Date, hour: number): string {
    const matches = roomEvents.filter((event) => overlapsHourSlot(event, day, hour));
    if (matches.length === 0) return '';
    return matches.map(reservationLabel).join('\n');
}

function dayColumnLabel(day: Date, index: number): string {
    return `${DAY_NAMES[index]}\n${formatDateDdMmYyyy(day)}`;
}

function buildTableBody(
    days: Date[],
    roomEvents: ReservationRecord[],
    hours: readonly number[],
): string[][] {
    return days.map((day, index) => [
        dayColumnLabel(day, index),
        ...hours.map((hour) => cellForSlot(roomEvents, day, hour)),
    ]);
}

function drawPageFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const y = pageHeight - 8;

    doc.setDrawColor(...GRAY_100);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y - 4, pageWidth - MARGIN, y - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_400);
    doc.text('Biblio Squad', MARGIN, y);
    doc.text(`${pageNumber} / ${totalPages}`, pageWidth - MARGIN, y, { align: 'right' });
}

function drawHeader(doc: jsPDF, labels: WeeklyCalendarPdfLabels): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    doc.setFillColor(...ACCENT);
    doc.rect(0, HEADER_HEIGHT - 1.2, pageWidth, 1.2, 'F');

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(labels.title, pageWidth / 2, 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 225, 235);
    doc.text(labels.weekRange, pageWidth / 2, 22, { align: 'center' });

    doc.setTextColor(...GRAY_900);
    return HEADER_HEIGHT + 6;
}

function drawRoomTitle(doc: jsPDF, roomName: string, y: number): number {
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, y - 4, 2.5, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY);
    doc.text(roomName, MARGIN + 5, y + 1);

    return y + 10;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_600);
    doc.text(title, MARGIN, y);

    return y + 4;
}

const TABLE_HEAD_STYLES = {
    fillColor: PRIMARY,
    textColor: WHITE,
    fontStyle: 'bold' as const,
    fontSize: 7,
    halign: 'center' as const,
    cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
};

const TABLE_BODY_STYLES = {
    font: 'helvetica' as const,
    fontSize: 6.5,
    cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
    textColor: GRAY_900,
    lineColor: GRAY_100,
    lineWidth: 0.2,
    valign: 'middle' as const,
    halign: 'center' as const,
    overflow: 'linebreak' as const,
    minCellHeight: 10,
};

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
        theme: 'plain',
        styles: TABLE_BODY_STYLES,
        headStyles: TABLE_HEAD_STYLES,
        alternateRowStyles: { fillColor: STRIPE },
        columnStyles: {
            0: {
                cellWidth: 24,
                fontStyle: 'bold',
                fontSize: 6.5,
                halign: 'center',
                fillColor: PRIMARY_LIGHT,
                textColor: PRIMARY,
            },
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 16 },
        tableWidth: 'auto',
        didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index === 0) return;
            const raw = data.cell.raw;
            const value =
                typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
            if (!value) return;
            data.cell.styles.fillColor = PRIMARY_LIGHT;
            data.cell.styles.textColor = PRIMARY;
            data.cell.styles.fontStyle = 'bold';
        },
    });

    return lastTableY(doc as DocWithAutoTable, startY + 90);
}

/**
 * Portrait A4 weekly room schedule with Biblio Squad branding.
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
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    }) as DocWithAutoTable;

    rooms.forEach((room, roomIndex) => {
        if (roomIndex > 0) doc.addPage();

        let cursorY = drawHeader(doc, labels);
        cursorY = drawRoomTitle(doc, room.name, cursorY);

        const roomEvents = events.filter((event) => event.roomId === room.id);

        cursorY = drawSectionTitle(doc, labels.morningSection, cursorY);
        const afterMorning = drawHourGrid(doc, cursorY, days, roomEvents, MORNING_HOURS);

        cursorY = drawSectionTitle(doc, labels.eveningSection, afterMorning + 6);
        drawHourGrid(doc, cursorY, days, roomEvents, EVENING_HOURS);
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        drawPageFooter(doc, page, totalPages);
    }

    const roomPart = rooms.length === 1 ? slugify(rooms[0].name) : `${rooms.length}-salles`;
    doc.save(`calendrier-semaine-${fileDateStamp(weekStart)}-${roomPart}.pdf`);
}

export { startOfWeek, addDays, startOfDay };

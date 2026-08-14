import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReservationRecord } from '@/lib/reservation-api';
import type { RoomRecord } from '@/lib/room-api';

export interface DailyCalendarPdfLabels {
    title: string;
    dayLabel: string;
    morningSection: string;
    eveningSection: string;
    empty: string;
    roomColumn: string;
}

const PRIMARY: [number, number, number] = [37, 49, 101];
const PRIMARY_LIGHT: [number, number, number] = [237, 240, 247];
const ACCENT: [number, number, number] = [228, 25, 29];
const GRAY_900: [number, number, number] = [33, 37, 46];
const GRAY_600: [number, number, number] = [74, 79, 92];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_100: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];
const STRIPE: [number, number, number] = [249, 250, 251];

const MARGIN = 12;
const HEADER_HEIGHT = 32;
const MORNING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15] as const;
const EVENING_HOURS = [16, 17, 18, 19, 20, 21, 22, 23] as const;

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDateDdMmYyyy(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function fileDateStamp(day: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function hourSlotLabel(startHour: number): string {
    return `${startHour}h`;
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

function drawHeader(doc: jsPDF, labels: DailyCalendarPdfLabels): number {
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
    doc.text(labels.dayLabel, pageWidth / 2, 22, { align: 'center' });

    doc.setTextColor(...GRAY_900);
    return HEADER_HEIGHT + 6;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_600);
    doc.text(title, MARGIN, y);
    return y + 4;
}

function drawHourGrid(
    doc: jsPDF,
    startY: number,
    day: Date,
    rooms: RoomRecord[],
    events: ReservationRecord[],
    hours: readonly number[],
    roomColumnLabel: string,
): number {
    const head = [roomColumnLabel, ...hours.map(hourSlotLabel)];
    const body = rooms.map((room) => {
        const roomEvents = events.filter((event) => event.roomId === room.id);
        return [
            room.name,
            ...hours.map((hour) => cellForSlot(roomEvents, day, hour)),
        ];
    });

    autoTable(doc, {
        startY,
        head: [head],
        body,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 7,
            cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
            textColor: GRAY_900,
            lineColor: GRAY_100,
            lineWidth: 0.2,
            valign: 'middle',
            halign: 'center',
            overflow: 'linebreak',
            minCellHeight: 11,
        },
        headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
        },
        alternateRowStyles: { fillColor: STRIPE },
        columnStyles: {
            0: {
                cellWidth: 32,
                fontStyle: 'bold',
                fontSize: 7,
                halign: 'left',
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
 * Landscape A4 day sheet: rooms × hours for the front desk.
 */
export function exportDailyCalendarPdf(params: {
    day: Date;
    rooms: RoomRecord[];
    events: ReservationRecord[];
    labels: DailyCalendarPdfLabels;
}): void {
    const { rooms, events, labels } = params;
    if (rooms.length === 0) return;

    const day = startOfDay(params.day);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    }) as DocWithAutoTable;

    let cursorY = drawHeader(doc, {
        ...labels,
        dayLabel: labels.dayLabel || formatDateDdMmYyyy(day),
    });

    cursorY = drawSectionTitle(doc, labels.morningSection, cursorY);
    const afterMorning = drawHourGrid(
        doc,
        cursorY,
        day,
        rooms,
        events,
        MORNING_HOURS,
        labels.roomColumn,
    );

    cursorY = drawSectionTitle(doc, labels.eveningSection, afterMorning + 6);
    drawHourGrid(doc, cursorY, day, rooms, events, EVENING_HOURS, labels.roomColumn);

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        drawPageFooter(doc, page, totalPages);
    }

    doc.save(`calendrier-jour-${fileDateStamp(day)}.pdf`);
}

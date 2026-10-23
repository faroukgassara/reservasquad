import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney } from '@/lib/daily-income-api';
import type { DashboardStats } from '@/lib/reservation-api';

export interface ReservationTrendRow {
    label: string;
    count: number;
    revenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
}

export interface RoomPerformanceRow {
    name: string;
    monthRevenue: number;
    totalRevenue: number;
    share: number;
}

export interface ReservationReportPdfLabels {
    title: string;
    period: string;
    summaryTitle: string;
    trendTitle: string;
    roomsTitle: string;
    revenueMonth: string;
    paidMonth: string;
    unpaidMonth: string;
    collectionRate: string;
    avgPerReservation: string;
    totalRevenue: string;
    totalPaid: string;
    monthCol: string;
    countCol: string;
    revenueCol: string;
    paidCol: string;
    unpaidCol: string;
    roomCol: string;
    shareCol: string;
    monthRevenueCol: string;
    totalRevenueCol: string;
    totalRow: string;
    empty: string;
}

export interface ExportReservationReportPdfOptions {
    fileStamp: string;
    periodLabel: string;
    stats: DashboardStats | null | undefined;
    trend: ReservationTrendRow[];
    rooms?: RoomPerformanceRow[];
    isGlobal?: boolean;
    labels: ReservationReportPdfLabels;
}

/** Biblio Squad brand colors */
const PRIMARY: [number, number, number] = [37, 49, 101];
const PRIMARY_LIGHT: [number, number, number] = [237, 240, 247];
const ACCENT: [number, number, number] = [228, 25, 29];
const GRAY_900: [number, number, number] = [33, 37, 46];
const GRAY_600: [number, number, number] = [74, 79, 92];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_100: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];

const MARGIN = 14;
const HEADER_HEIGHT = 32;

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function lastTableY(doc: DocWithAutoTable, fallback: number): number {
    return doc.lastAutoTable?.finalY ?? fallback;
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
    doc.text('Biblio Squad — Rapport des Réservations', MARGIN, y);
    doc.text(`${pageNumber} / ${totalPages}`, pageWidth - MARGIN, y, { align: 'right' });
}

function drawHeader(doc: jsPDF, labels: ReservationReportPdfLabels): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top primary bar
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    // Accent stripe
    doc.setFillColor(...ACCENT);
    doc.rect(0, HEADER_HEIGHT - 1.2, pageWidth, 1.2, 'F');

    // Title
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(labels.title, pageWidth / 2, 13, { align: 'center' });

    // Subtitle / Period
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 225, 235);
    doc.text(labels.period, pageWidth / 2, 22, { align: 'center' });

    doc.setTextColor(...GRAY_900);
    return HEADER_HEIGHT + 8;
}

function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(text, MARGIN, y);
    return y + 5;
}

function drawSummaryCards(
    doc: jsPDF,
    stats: DashboardStats | null | undefined,
    labels: ReservationReportPdfLabels,
    startY: number,
    isGlobal?: boolean,
): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;
    const gap = 3;
    const cols = 3;
    const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
    const cardHeight = 17;

    const monthRevenue = stats?.month.revenue ?? 0;
    const monthPaid = stats?.month.paidRevenue ?? 0;
    const count = stats?.month.confirmed ?? stats?.month.total ?? 0;
    const avgPerReservation = count > 0 ? monthRevenue / count : 0;
    const rate = monthRevenue > 0 ? Math.round((monthPaid / monthRevenue) * 100) : 0;

    const items: { label: string; value: string; highlight?: boolean }[] = [
        { label: isGlobal ? labels.totalRevenue : labels.revenueMonth, value: formatMoney(monthRevenue), highlight: true },
        { label: `${isGlobal ? labels.totalPaid : labels.paidMonth} (${rate}%)`, value: formatMoney(monthPaid) },
        { label: labels.unpaidMonth, value: formatMoney(stats?.month.unpaidRevenue ?? 0) },
        { label: labels.avgPerReservation, value: formatMoney(avgPerReservation) },
        { label: labels.totalRevenue, value: formatMoney(stats?.totalRevenue ?? 0) },
        { label: labels.totalPaid, value: formatMoney(stats?.totalPaid ?? 0) },
    ];

    items.forEach((item, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = MARGIN + col * (cardWidth + gap);
        const y = startY + row * (cardHeight + gap);

        if (item.highlight) {
            doc.setFillColor(...PRIMARY_LIGHT);
            doc.setDrawColor(...PRIMARY);
            doc.setLineWidth(0.4);
        } else {
            doc.setFillColor(...WHITE);
            doc.setDrawColor(...GRAY_100);
            doc.setLineWidth(0.3);
        }
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY_600);
        doc.text(item.label, x + 4, y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(item.highlight ? PRIMARY[0] : GRAY_900[0], item.highlight ? PRIMARY[1] : GRAY_900[1], item.highlight ? PRIMARY[2] : GRAY_900[2]);
        doc.text(item.value, x + 4, y + 13);
    });

    const totalRows = Math.ceil(items.length / cols);
    return startY + totalRows * (cardHeight + gap) + 4;
}

export function exportReservationReportPdf({
    fileStamp,
    stats,
    trend,
    rooms,
    isGlobal,
    labels,
}: ExportReservationReportPdfOptions): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocWithAutoTable;

    let cursorY = drawHeader(doc, labels);

    cursorY = drawSectionTitle(doc, labels.summaryTitle, cursorY);
    cursorY = drawSummaryCards(doc, stats, labels, cursorY, isGlobal);

    cursorY = drawSectionTitle(doc, labels.trendTitle, cursorY + 4);

    const bodyRows = trend.length > 0
        ? trend.map((row) => [
            row.label,
            String(row.count),
            formatMoney(row.revenue),
            formatMoney(row.paidRevenue),
            formatMoney(row.unpaidRevenue),
        ])
        : [[labels.empty, '—', '—', '—', '—']];

    const totals = trend.reduce(
        (acc, r) => ({
            count: acc.count + r.count,
            revenue: acc.revenue + r.revenue,
            paidRevenue: acc.paidRevenue + r.paidRevenue,
            unpaidRevenue: acc.unpaidRevenue + r.unpaidRevenue,
        }),
        { count: 0, revenue: 0, paidRevenue: 0, unpaidRevenue: 0 },
    );

    const footRows = trend.length > 0
        ? [
            [
                labels.totalRow,
                String(totals.count),
                formatMoney(totals.revenue),
                formatMoney(totals.paidRevenue),
                formatMoney(totals.unpaidRevenue),
            ],
        ]
        : undefined;

    autoTable(doc, {
        startY: cursorY,
        head: [[
            labels.monthCol,
            labels.countCol,
            labels.revenueCol,
            labels.paidCol,
            labels.unpaidCol,
        ]],
        body: bodyRows,
        foot: footRows,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
            textColor: GRAY_900,
            lineColor: GRAY_100,
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        footStyles: {
            fillColor: PRIMARY_LIGHT,
            textColor: PRIMARY,
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { halign: 'center', cellWidth: 28 },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    });

    cursorY = lastTableY(doc, cursorY + 40) + 8;

    if (rooms && rooms.length > 0) {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (cursorY > pageHeight - 50) {
            doc.addPage();
            cursorY = 20;
        }

        cursorY = drawSectionTitle(doc, labels.roomsTitle, cursorY);

        const roomRows = rooms.map((r) => [
            r.name,
            `${r.share}%`,
            formatMoney(r.monthRevenue),
            formatMoney(r.totalRevenue),
        ]);

        autoTable(doc, {
            startY: cursorY,
            head: [[
                labels.roomCol,
                labels.shareCol,
                labels.monthRevenueCol,
                labels.totalRevenueCol,
            ]],
            body: roomRows,
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 8.5,
                cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                textColor: GRAY_900,
                lineColor: GRAY_100,
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: PRIMARY,
                textColor: WHITE,
                fontStyle: 'bold',
                fontSize: 8.5,
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 28 },
                2: { halign: 'right', cellWidth: 42 },
                3: { halign: 'right', cellWidth: 42 },
            },
            margin: { left: MARGIN, right: MARGIN, bottom: 16 },
        });
    }

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        drawPageFooter(doc, page, totalPages);
    }

    doc.save(`rapport-reservations-${fileStamp}.pdf`);
}

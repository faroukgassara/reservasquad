import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
    DailyIncomeRecord,
    DailyIncomeSummary,
    IncomeLineRecord,
} from '@/lib/daily-income-api';

export interface DailyIncomePdfLabels {
    title: string;
    period: string;
    totalIncome: string;
    totalCharges: string;
    totalInvestments: string;
    totalSavings: string;
    totalBenefits: string;
    netBalance: string;
    daysTitle: string;
    linesTitle: string;
    date: string;
    chargesInvestment: string;
    savings: string;
    benefits: string;
    type: string;
    label: string;
    amount: string;
    charge: string;
    investment: string;
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
const SUCCESS: [number, number, number] = [22, 163, 74];
const WARNING_BG: [number, number, number] = [254, 243, 199];
const SUCCESS_BG: [number, number, number] = [220, 252, 231];

const MARGIN = 14;
const HEADER_HEIGHT = 32;

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function formatDateDdMmYyyy(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function formatAmount(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
    }).format(amount);
}

function fileStamp(year: number, month: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}`;
}

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
    doc.text('Biblio Squad', MARGIN, y);
    doc.text(`${pageNumber} / ${totalPages}`, pageWidth - MARGIN, y, { align: 'right' });
}

function drawHeader(doc: jsPDF, labels: DailyIncomePdfLabels): number {
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
    doc.text(labels.period, pageWidth / 2, 22, { align: 'center' });

    doc.setTextColor(...GRAY_900);
    return HEADER_HEIGHT + 8;
}

function drawSummaryCards(
    doc: jsPDF,
    summary: DailyIncomeSummary | null | undefined,
    labels: DailyIncomePdfLabels,
    startY: number,
): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;
    const gap = 3;
    const cols = 3;
    const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
    const cardHeight = 18;
    const rows = 2;

    const items: { label: string; value: string; highlight?: boolean }[] = [
        { label: labels.totalIncome, value: formatAmount(summary?.totalIncome ?? 0) },
        { label: labels.totalCharges, value: formatAmount(summary?.totalCharges ?? 0) },
        { label: labels.totalInvestments, value: formatAmount(summary?.totalInvestments ?? 0) },
        { label: labels.totalSavings, value: formatAmount(summary?.totalSavings ?? 0) },
        { label: labels.totalBenefits, value: formatAmount(summary?.totalBenefits ?? 0) },
        { label: labels.netBalance, value: formatAmount(summary?.netBalance ?? 0), highlight: true },
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
        doc.text(item.label, x + 3, y + 6, { maxWidth: cardWidth - 6 });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(item.highlight ? 10 : 9);
        doc.setTextColor(...(item.highlight ? PRIMARY : GRAY_900));
        doc.text(item.value, x + 3, y + 13.5, { maxWidth: cardWidth - 6 });
    });

    return startY + rows * (cardHeight + gap) + 6;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, y - 4, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(title, MARGIN + 5, y + 1);

    return y + 8;
}

const TABLE_HEAD_STYLES = {
    fillColor: PRIMARY,
    textColor: WHITE,
    fontStyle: 'bold' as const,
    fontSize: 8,
    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
};

const TABLE_BODY_STYLES = {
    font: 'helvetica' as const,
    fontSize: 8,
    cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
    textColor: GRAY_900,
    lineColor: GRAY_100,
    lineWidth: 0.2,
    valign: 'middle' as const,
};

/**
 * Portrait A4 monthly daily-income report with branded header, KPI cards, and styled tables.
 */
export function exportDailyIncomePdf(params: {
    year: number;
    month: number;
    monthLabel: string;
    days: DailyIncomeRecord[];
    lines: IncomeLineRecord[];
    summary: DailyIncomeSummary | null | undefined;
    labels: DailyIncomePdfLabels;
}): void {
    const { year, month, monthLabel, days, lines, summary, labels } = params;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    }) as DocWithAutoTable;

    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = drawHeader(doc, labels);
    cursorY = drawSummaryCards(doc, summary, labels, cursorY);
    cursorY = drawSectionTitle(doc, labels.daysTitle, cursorY);

    const dayBody =
        days.length > 0
            ? days.map((day) => [
                  formatDateDdMmYyyy(day.date),
                  formatAmount(day.totalIncome),
                  formatAmount(day.chargesInvestment ?? 0),
                  formatAmount(day.savings),
                  formatAmount(day.benefits ?? 0),
              ])
            : [[labels.empty, '—', '—', '—', '—']];

    autoTable(doc, {
        startY: cursorY,
        head: [
            [
                labels.date,
                labels.totalIncome,
                labels.chargesInvestment,
                labels.savings,
                labels.benefits,
            ],
        ],
        body: dayBody,
        theme: 'plain',
        styles: TABLE_BODY_STYLES,
        headStyles: TABLE_HEAD_STYLES,
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    });

    cursorY = lastTableY(doc, cursorY + 40) + 10;

    if (cursorY > pageHeight - 50) {
        doc.addPage();
        cursorY = 20;
    }

    cursorY = drawSectionTitle(doc, labels.linesTitle, cursorY);

    const lineBody =
        lines.length > 0
            ? lines.map((line) => [
                  formatDateDdMmYyyy(line.date),
                  line.type === 'CHARGE' ? labels.charge : labels.investment,
                  line.label,
                  formatAmount(line.amount),
              ])
            : [[labels.empty, '—', '—', '—']];

    autoTable(doc, {
        startY: cursorY,
        head: [[labels.date, labels.type, labels.label, labels.amount]],
        body: lineBody,
        theme: 'plain',
        styles: TABLE_BODY_STYLES,
        headStyles: TABLE_HEAD_STYLES,
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 32, halign: 'center' },
            2: { cellWidth: 'auto' },
            3: { halign: 'right', cellWidth: 32 },
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 16 },
        didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 1) return;
            const isCharge = data.cell.raw === labels.charge;
            data.cell.styles.fillColor = isCharge ? WARNING_BG : SUCCESS_BG;
            data.cell.styles.textColor = isCharge ? [180, 83, 9] : SUCCESS;
            data.cell.styles.fontStyle = 'bold';
        },
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        drawPageFooter(doc, page, totalPages);
    }

    doc.save(`daily-income-${fileStamp(year, month)}.pdf`);
}

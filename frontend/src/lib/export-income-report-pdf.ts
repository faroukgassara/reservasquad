import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, type DailyIncomeSummary } from '@/lib/daily-income-api';

export interface IncomeBreakdownRow {
    label: string;
    income: number;
    expenses: number;
    savings: number;
    benefits: number;
    netBalance: number;
}

export interface IncomeReportPdfLabels {
    title: string;
    period: string;
    summaryTitle: string;
    trendTitle: string;
    totalIncome: string;
    totalCharges: string;
    netBalance: string;
    totalSavings: string;
    totalBenefits: string;
    totalSavingsForCharges: string;
    previousMonthRest?: string;
    periodCol: string;
    incomeCol: string;
    chargesCol: string;
    savingsCol: string;
    benefitsCol: string;
    netBalanceCol: string;
    totalRow: string;
    empty: string;
}

export interface ExportIncomeReportPdfOptions {
    fileStamp: string;
    periodLabel: string;
    summary: DailyIncomeSummary | null | undefined;
    breakdown: IncomeBreakdownRow[];
    isGlobal?: boolean;
    labels: IncomeReportPdfLabels;
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
    doc.text('Biblio Squad — Rapport Financier des Recettes', MARGIN, y);
    doc.text(`${pageNumber} / ${totalPages}`, pageWidth - MARGIN, y, { align: 'right' });
}

function drawHeader(doc: jsPDF, labels: IncomeReportPdfLabels): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top primary bar
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    // Accent bottom stripe
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
    summary: DailyIncomeSummary | null | undefined,
    labels: IncomeReportPdfLabels,
    startY: number,
    isGlobal?: boolean,
): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;
    const gap = 3;
    const cols = 3;
    const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
    const cardHeight = 17;

    const totalCharges = (summary?.totalCharges ?? 0) + (summary?.totalInvestments ?? 0);

    const items: { label: string; value: string; highlight?: boolean }[] = [
        { label: labels.totalIncome, value: formatMoney(summary?.totalIncome ?? 0) },
        { label: labels.totalCharges, value: formatMoney(totalCharges) },
        { label: labels.netBalance, value: formatMoney(summary?.netBalance ?? 0), highlight: true },
        { label: labels.totalSavings, value: formatMoney(summary?.totalSavings ?? 0) },
        { label: labels.totalBenefits, value: formatMoney(summary?.totalBenefits ?? 0) },
        {
            label: labels.totalSavingsForCharges,
            value: formatMoney(summary?.totalSavingsForCharges ?? 0),
        },
    ];

    if (!isGlobal && labels.previousMonthRest) {
        items.push({
            label: labels.previousMonthRest,
            value: formatMoney(summary?.previousMonthRest ?? 0),
        });
    }

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

export function exportIncomeReportPdf({
    fileStamp,
    summary,
    breakdown,
    isGlobal,
    labels,
}: ExportIncomeReportPdfOptions): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocWithAutoTable;

    let cursorY = drawHeader(doc, labels);

    cursorY = drawSectionTitle(doc, labels.summaryTitle, cursorY);
    cursorY = drawSummaryCards(doc, summary, labels, cursorY, isGlobal);

    cursorY = drawSectionTitle(doc, labels.trendTitle, cursorY + 4);

    const bodyRows = breakdown.length > 0
        ? breakdown.map((row) => [
            row.label,
            formatMoney(row.income),
            formatMoney(row.expenses),
            formatMoney(row.savings),
            formatMoney(row.benefits),
            formatMoney(row.netBalance),
        ])
        : [[labels.empty, '—', '—', '—', '—', '—']];

    // Compute totals if we have rows
    const totals = breakdown.reduce(
        (acc, r) => ({
            income: acc.income + r.income,
            expenses: acc.expenses + r.expenses,
            savings: acc.savings + r.savings,
            benefits: acc.benefits + r.benefits,
            netBalance: acc.netBalance + r.netBalance,
        }),
        { income: 0, expenses: 0, savings: 0, benefits: 0, netBalance: 0 },
    );

    const footRows = breakdown.length > 0
        ? [
            [
                labels.totalRow,
                formatMoney(totals.income),
                formatMoney(totals.expenses),
                formatMoney(totals.savings),
                formatMoney(totals.benefits),
                formatMoney(totals.netBalance),
            ],
        ]
        : undefined;

    autoTable(doc, {
        startY: cursorY,
        head: [[
            labels.periodCol,
            labels.incomeCol,
            labels.chargesCol,
            labels.savingsCol,
            labels.benefitsCol,
            labels.netBalanceCol,
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
            0: { cellWidth: 32 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        drawPageFooter(doc, page, totalPages);
    }

    doc.save(`rapport-recettes-${fileStamp}.pdf`);
}

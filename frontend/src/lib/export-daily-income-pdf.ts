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

function formatDateDdMmYyyy(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function formatAmount(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return `${amount.toFixed(2)} TND`;
}

function fileStamp(year: number, month: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}`;
}

/**
 * Portrait A4 monthly daily-income report: summary, daily rows, charge/investment lines.
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
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(labels.title, pageWidth / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(
        labels.period.replace('{month}', monthLabel).replace('{year}', String(year)),
        pageWidth / 2,
        26,
        { align: 'center' },
    );

    const summaryRows: string[][] = [
        [labels.totalIncome, formatAmount(summary?.totalIncome ?? 0)],
        [labels.totalCharges, formatAmount(summary?.totalCharges ?? 0)],
        [labels.totalInvestments, formatAmount(summary?.totalInvestments ?? 0)],
        [labels.totalSavings, formatAmount(summary?.totalSavings ?? 0)],
        [labels.totalBenefits, formatAmount(summary?.totalBenefits ?? 0)],
        [labels.netBalance, formatAmount(summary?.netBalance ?? 0)],
    ];

    autoTable(doc, {
        startY: 32,
        head: [['', '']],
        body: summaryRows,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 2,
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 70 },
            1: { halign: 'right', cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
        showHead: false,
    });

    let cursorY =
        (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50;
    cursorY += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(labels.daysTitle, margin, cursorY);
    cursorY += 4;

    const dayBody =
        days.length > 0
            ? days.map((day) => [
                  formatDateDdMmYyyy(day.date),
                  formatAmount(day.totalIncome),
                  formatAmount(day.chargesInvestment ?? 0),
                  formatAmount(day.savings),
                  formatAmount(day.benefits ?? 0),
              ])
            : [[labels.empty, '', '', '', '']];

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
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
        },
        margin: { left: margin, right: margin },
    });

    cursorY =
        (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
        cursorY + 40;
    cursorY += 10;

    if (cursorY > 250) {
        doc.addPage();
        cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(labels.linesTitle, margin, cursorY);
    cursorY += 4;

    const lineBody =
        lines.length > 0
            ? lines.map((line) => [
                  formatDateDdMmYyyy(line.date),
                  line.type === 'CHARGE' ? labels.charge : labels.investment,
                  line.label,
                  formatAmount(line.amount),
              ])
            : [[labels.empty, '', '', '']];

    autoTable(doc, {
        startY: cursorY,
        head: [[labels.date, labels.type, labels.label, labels.amount]],
        body: lineBody,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            3: { halign: 'right' },
        },
        margin: { left: margin, right: margin },
    });

    doc.save(`daily-income-${fileStamp(year, month)}.pdf`);
}

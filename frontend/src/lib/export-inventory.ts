import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney } from '@/lib/daily-income-api';
import { toAmount, type PosProduct } from '@/lib/pos-api';

export interface InventoryExportLabels {
    title: string;
    subtitle: string;
    scope: string;
    date: string;
    totalProducts: string;
    totalUnits: string;
    totalCostValue: string;
    totalRetailValue: string;
    reference: string;
    productName: string;
    category: string;
    type: string;
    stockable: string;
    consumable: string;
    unitCost: string;
    unitPrice: string;
    theoreticalStock: string;
    physicalStock: string;
    discrepancy: string;
    stockCostValue: string;
    empty: string;
    auditor: string;
    verifier: string;
    signature: string;
    notes: string;
    page: string;
    of: string;
}

/** Biblio Squad theme — primary navy #253165 & accents */
const PRIMARY: [number, number, number] = [37, 49, 101];
const PRIMARY_LIGHT: [number, number, number] = [237, 240, 247];
const ACCENT: [number, number, number] = [228, 25, 29];
const GRAY_900: [number, number, number] = [33, 37, 46];
const GRAY_600: [number, number, number] = [74, 79, 92];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_100: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];
const SUCCESS: [number, number, number] = [22, 163, 74];
const DANGER: [number, number, number] = [220, 38, 38];

const MARGIN = 12;

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function nowFormatted(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dateFileStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function calculateInventoryTotals(products: PosProduct[]) {
    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    for (const p of products) {
        const stock = toAmount(p.stockQty);
        const cost = toAmount(p.cost);
        const price = toAmount(p.price);

        if (p.type === 'STOCKABLE') {
            totalUnits += stock;
            totalCostValue += stock * cost;
            totalRetailValue += stock * price;
        }
    }

    return {
        totalProducts: products.length,
        totalUnits: Math.round(totalUnits * 1000) / 1000,
        totalCostValue: Math.round(totalCostValue * 1000) / 1000,
        totalRetailValue: Math.round(totalRetailValue * 1000) / 1000,
    };
}

/**
 * Landscape A4 printable inventory sheet with summary KPIs, theoretical stock, and physical count columns.
 */
export function exportInventoryPdf(params: {
    products: PosProduct[];
    categoryFilterName?: string;
    stockableOnly?: boolean;
    labels: InventoryExportLabels;
}): void {
    const { products, categoryFilterName, stockableOnly, labels } = params;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    }) as DocWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totals = calculateInventoryTotals(products);

    // Header banner
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Accent strip
    doc.setFillColor(...ACCENT);
    doc.rect(0, 22, pageWidth, 1.5, 'F');

    // Brand & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text('BIBLIO SQUAD', MARGIN, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(215, 222, 240);
    doc.text(`— ${labels.title.toUpperCase()}`, MARGIN + 40, 11);

    // Generated timestamp
    doc.setFontSize(8);
    doc.setTextColor(215, 222, 240);
    const dateText = `${labels.date}: ${nowFormatted()}`;
    doc.text(dateText, pageWidth - MARGIN - doc.getTextWidth(dateText), 11);

    // Scope & Filter Sub-bar
    let cursorY = 28;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY_600);

    const filterText = [
        categoryFilterName ? `${labels.category}: ${categoryFilterName}` : labels.scope,
        stockableOnly ? labels.stockable : null,
    ]
        .filter(Boolean)
        .join(' · ');

    doc.text(filterText, MARGIN, cursorY);
    cursorY += 5;

    // KPI Summary Cards
    const cardGap = 4;
    const cardCount = 4;
    const totalGap = (cardCount - 1) * cardGap;
    const cardWidth = (pageWidth - MARGIN * 2 - totalGap) / cardCount;
    const cardHeight = 15;

    const kpis = [
        { label: labels.totalProducts, value: String(totals.totalProducts), color: PRIMARY },
        { label: labels.totalUnits, value: `${totals.totalUnits}`, color: SUCCESS },
        { label: labels.totalCostValue, value: formatMoney(totals.totalCostValue), color: PRIMARY },
        { label: labels.totalRetailValue, value: formatMoney(totals.totalRetailValue), color: GRAY_900 },
    ];

    kpis.forEach((kpi, idx) => {
        const x = MARGIN + idx * (cardWidth + cardGap);
        doc.setFillColor(...GRAY_100);
        doc.roundedRect(x, cursorY, cardWidth, cardHeight, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY_600);
        doc.text(kpi.label, x + 3.5, cursorY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...kpi.color);
        doc.text(kpi.value, x + 3.5, cursorY + 11.5);
    });

    cursorY += cardHeight + 6;

    // Table Body
    const tableBody =
        products.length > 0
            ? products.map((p) => {
                const stock = toAmount(p.stockQty);
                const cost = toAmount(p.cost);
                const price = toAmount(p.price);
                const stockVal = stock * cost;
                const ref = p.barcode || p.reference || '—';

                return [
                    ref,
                    p.name,
                    p.category?.name || '—',
                    p.type === 'STOCKABLE' ? labels.stockable : labels.consumable,
                    formatMoney(price),
                    formatMoney(cost),
                    String(stock),
                    '', // Physical count write-in box
                    '', // Discrepancy write-in box
                    p.type === 'STOCKABLE' ? formatMoney(stockVal) : '—',
                ];
            })
            : [[labels.empty, '', '', '', '', '', '', '', '', '']];

    autoTable(doc, {
        startY: cursorY,
        head: [
            [
                labels.reference,
                labels.productName,
                labels.category,
                labels.type,
                labels.unitPrice,
                labels.unitCost,
                labels.theoreticalStock,
                labels.physicalStock,
                labels.discrepancy,
                labels.stockCostValue,
            ],
        ],
        body: tableBody,
        theme: 'plain',
        styles: {
            fontSize: 7.5,
            cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
            textColor: GRAY_900,
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
            valign: 'middle',
        },
        headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: 'bold',
            fontSize: 7.5,
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [250, 250, 252],
        },
        columnStyles: {
            0: { cellWidth: 26 }, // Ref / Barcode
            1: { cellWidth: 'auto' }, // Product Name
            2: { cellWidth: 28 }, // Category
            3: { cellWidth: 20 }, // Type
            4: { cellWidth: 22, halign: 'right' }, // Unit Price
            5: { cellWidth: 22, halign: 'right' }, // Unit Cost
            6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Theoretical Stock
            7: { cellWidth: 24, halign: 'center' }, // Physical Stock box
            8: { cellWidth: 20, halign: 'center' }, // Discrepancy box
            9: { cellWidth: 24, halign: 'right' }, // Stock Cost Val
        },
        margin: { left: MARGIN, right: MARGIN, bottom: 20 },
        didParseCell: (data) => {
            // Draw printable write-in box for physical count & discrepancy
            if (data.section === 'body' && (data.column.index === 7 || data.column.index === 8)) {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [180, 185, 195];
            }
            if (data.section === 'body' && data.column.index === 6) {
                const stockNum = Number(data.cell.raw);
                if (stockNum <= 0) {
                    data.cell.styles.textColor = DANGER;
                }
            }
        },
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);

        // Footer on all pages
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY_400);

        const pageStr = `${labels.page} ${page} ${labels.of} ${totalPages}`;
        doc.text(pageStr, pageWidth - MARGIN - doc.getTextWidth(pageStr), pageHeight - 8);

        doc.text('Biblio Squad · Inventaire & Gestion de stock', MARGIN, pageHeight - 8);

        // On the final page, add auditor signature and verification block if room permits
        if (page === totalPages) {
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : pageHeight - 25;
            if (finalY < pageHeight - 16) {
                doc.setDrawColor(...GRAY_400);
                doc.setLineDashPattern([1, 1], 0);

                doc.setFontSize(7.5);
                doc.setTextColor(...GRAY_600);
                doc.text(`${labels.auditor} : ___________________________`, MARGIN, pageHeight - 13);
                doc.text(`${labels.verifier} : ___________________________`, MARGIN + 90, pageHeight - 13);
                doc.text(`${labels.signature} : ___________________________`, MARGIN + 180, pageHeight - 13);
            }
        }
    }

    doc.save(`inventaire-stock-${dateFileStamp()}.pdf`);
}

/**
 * Downloads a clean UTF-8 CSV with BOM for direct compatibility with Excel and spreadsheet tools.
 */
export function exportInventoryCsv(params: {
    products: PosProduct[];
    categoryFilterName?: string;
    labels: InventoryExportLabels;
}): void {
    const { products, labels } = params;

    const headers = [
        labels.reference,
        labels.productName,
        labels.category,
        labels.type,
        labels.unitPrice,
        labels.unitCost,
        labels.theoreticalStock,
        labels.physicalStock,
        labels.discrepancy,
        labels.stockCostValue,
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows = products.map((p) => {
        const stock = toAmount(p.stockQty);
        const cost = toAmount(p.cost);
        const price = toAmount(p.price);
        const stockVal = p.type === 'STOCKABLE' ? stock * cost : 0;
        const ref = p.barcode || p.reference || '';

        return [
            escapeCsv(ref),
            escapeCsv(p.name),
            escapeCsv(p.category?.name || ''),
            escapeCsv(p.type === 'STOCKABLE' ? labels.stockable : labels.consumable),
            escapeCsv(price.toFixed(3)),
            escapeCsv(cost.toFixed(3)),
            escapeCsv(stock),
            escapeCsv(''), // Empty for physical stock entry
            escapeCsv(''), // Empty for discrepancy calculation
            escapeCsv(stockVal.toFixed(3)),
        ].join(';');
    });

    // \uFEFF BOM ensures Excel interprets UTF-8 characters (accents, etc.) properly
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventaire-stock-${dateFileStamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

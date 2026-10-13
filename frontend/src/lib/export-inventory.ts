import { jsPDF } from 'jspdf';
import { getMediaUrl } from '@/lib/media-url';
import { toAmount, type PosProduct } from '@/lib/pos-api';

export interface InventoryExportLabels {
    title: string;
    subtitle: string;
    scope: string;
    date: string;
    image?: string;
    productName: string;
    stock?: string;
    category?: string;
    empty: string;
    page: string;
    of: string;
    totalProducts?: string;
    totalUnits?: string;
    totalCostValue?: string;
    totalRetailValue?: string;
    reference?: string;
    type?: string;
    stockable?: string;
    consumable?: string;
    unitCost?: string;
    unitPrice?: string;
    theoreticalStock?: string;
    physicalStock?: string;
    discrepancy?: string;
    stockCostValue?: string;
    auditor?: string;
    verifier?: string;
    signature?: string;
    notes?: string;
}

/** Biblio Squad theme — primary navy #253165 & accents */
const PRIMARY: [number, number, number] = [37, 49, 101];
const ACCENT: [number, number, number] = [228, 25, 29];
const GRAY_900: [number, number, number] = [33, 37, 46];
const GRAY_600: [number, number, number] = [74, 79, 92];
const GRAY_400: [number, number, number] = [156, 163, 175];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 10;
const FOOTER_Y = 290;

const COLS = 3;
const GAP_X = 3.5;
const GAP_Y = 3.0;
const AVAILABLE_W = PAGE_W - 2 * MARGIN_X;
const CARD_W = (AVAILABLE_W - (COLS - 1) * GAP_X) / COLS; // ~61 mm
const CARD_H = 18.5; // mm

const P1_START_Y = 25;
const P_LATER_START_Y = 13;
const ROWS_PER_PAGE = 12;
const CARDS_PER_PAGE = COLS * ROWS_PER_PAGE; // 36 cards per page

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

/**
 * Loads an image via browser Image element and renders it into a JPEG Data URL.
 * Automatically resizes to max 120x120 for crisp display and minimal PDF payload.
 */
async function loadBase64Image(imageUrl: string | null): Promise<string | null> {
    if (!imageUrl) return null;
    const url = getMediaUrl(imageUrl);
    if (!url) return null;
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 3000);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                const maxDim = 120;
                let w = img.naturalWidth || img.width || maxDim;
                let h = img.naturalHeight || img.height || maxDim;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                canvas.width = Math.max(1, w);
                canvas.height = Math.max(1, h);
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = url;
    });
}

/**
 * Draws a subtle thumbnail placeholder when a product has no image.
 */
function drawPlaceholder(doc: jsPDF, x: number, y: number, size: number, name?: string) {
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.roundedRect(x, y, size, size, 1, 1, 'FD');
    const letter = (name?.trim()?.charAt(0) || '•').toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const textWidth = doc.getTextWidth(letter);
    doc.text(letter, x + (size - textWidth) / 2, y + size / 2 + 2.5);
}

/**
 * Highly-condensed Portrait A4 printable inventory grid (3 cards per row, 36 cards per page).
 * Maximizes items per sheet to minimize paper consumption while keeping product image, name, and stock.
 */
export async function exportInventoryPdf(params: {
    products: PosProduct[];
    categoryFilterName?: string;
    stockableOnly?: boolean;
    labels: InventoryExportLabels;
}): Promise<void> {
    const { products, categoryFilterName, labels } = params;

    // Preload images in parallel
    const imageMap = new Map<string, string | null>();
    await Promise.all(
        products.map(async (p) => {
            if (p.imageUrl) {
                const dataUrl = await loadBase64Image(p.imageUrl);
                imageMap.set(p.id, dataUrl);
            }
        }),
    );

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const totalProducts = products.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / CARDS_PER_PAGE));

    const drawHeader = (page: number) => {
        if (page === 1) {
            // Top Header Banner
            doc.setFillColor(...PRIMARY);
            doc.rect(0, 0, PAGE_W, 16, 'F');

            // Accent Red Strip
            doc.setFillColor(...ACCENT);
            doc.rect(0, 16, PAGE_W, 1.2, 'F');

            // Brand & Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...WHITE);
            doc.text('BIBLIO SQUAD', MARGIN_X, 10.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(215, 222, 240);
            doc.text(`— ${labels.title.toUpperCase()}`, MARGIN_X + 34, 10.5);

            // Generated timestamp
            doc.setFontSize(7.5);
            doc.setTextColor(215, 222, 240);
            const dateText = `${labels.date}: ${nowFormatted()}`;
            doc.text(dateText, PAGE_W - MARGIN_X - doc.getTextWidth(dateText), 10.5);

            // Sub-bar
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...GRAY_600);
            const filterText = categoryFilterName
                ? `${labels.category || 'Catégorie'} : ${categoryFilterName}`
                : labels.scope;
            doc.text(filterText, MARGIN_X, 22);

            const countText = `${products.length} articles`;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...PRIMARY);
            doc.text(countText, PAGE_W - MARGIN_X - doc.getTextWidth(countText), 22);
        } else {
            // Subsequent pages compact header
            doc.setFillColor(...PRIMARY);
            doc.rect(0, 0, PAGE_W, 8, 'F');
            doc.setFillColor(...ACCENT);
            doc.rect(0, 8, PAGE_W, 0.8, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...WHITE);
            doc.text(`BIBLIO SQUAD — ${labels.title.toUpperCase()}`, MARGIN_X, 5.5);

            const countText = `${products.length} articles`;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(215, 222, 240);
            doc.text(countText, PAGE_W - MARGIN_X - doc.getTextWidth(countText), 5.5);
        }
    };

    const drawFooter = (page: number) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY_400);

        const pageStr = `${labels.page} ${page} ${labels.of} ${totalPages}`;
        doc.text(pageStr, PAGE_W - MARGIN_X - doc.getTextWidth(pageStr), FOOTER_Y);
        doc.text('Biblio Squad · Inventaire du stock', MARGIN_X, FOOTER_Y);
    };

    if (totalProducts === 0) {
        drawHeader(1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...GRAY_600);
        doc.text(labels.empty, MARGIN_X, P1_START_Y + 10);
        drawFooter(1);
        doc.save(`inventaire-stock-${dateFileStamp()}.pdf`);
        return;
    }

    let currentPage = 1;
    drawHeader(currentPage);
    drawFooter(currentPage);

    products.forEach((product, index) => {
        const pageIndex = Math.floor(index / CARDS_PER_PAGE);
        const targetPage = pageIndex + 1;

        if (targetPage > currentPage) {
            doc.addPage();
            currentPage = targetPage;
            drawHeader(currentPage);
            drawFooter(currentPage);
        }

        const indexOnPage = index % CARDS_PER_PAGE;
        const col = indexOnPage % COLS;
        const row = Math.floor(indexOnPage / COLS);

        const cardX = MARGIN_X + col * (CARD_W + GAP_X);
        const startY = currentPage === 1 ? P1_START_Y : P_LATER_START_Y;
        const cardY = startY + row * (CARD_H + GAP_Y);

        // Card Container
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.2);
        doc.roundedRect(cardX, cardY, CARD_W, CARD_H, 1.5, 1.5, 'FD');

        // Product Thumbnail (Left)
        const imgSize = 13.5;
        const imgX = cardX + 2.5;
        const imgY = cardY + (CARD_H - imgSize) / 2;
        const dataUrl = imageMap.get(product.id);

        if (dataUrl) {
            try {
                doc.addImage(dataUrl, 'JPEG', imgX, imgY, imgSize, imgSize);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.15);
                doc.rect(imgX, imgY, imgSize, imgSize);
            } catch {
                drawPlaceholder(doc, imgX, imgY, imgSize, product.name);
            }
        } else {
            drawPlaceholder(doc, imgX, imgY, imgSize, product.name);
        }

        // Product Name (Right top)
        const textX = imgX + imgSize + 2.5;
        const textW = CARD_W - (textX - cardX) - 2.5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY_900);
        const rawLines = doc.splitTextToSize(product.name, textW);
        const titleLines = rawLines.slice(0, 2);
        doc.text(titleLines, textX, cardY + 5.2);

        // Stock Quantity Pill (Right bottom)
        const stockNum = toAmount(product.stockQty);
        const stockStr = `${labels.stock || 'Stock'} : ${stockNum}`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const stockTextWidth = doc.getTextWidth(stockStr);
        const pillW = stockTextWidth + 4;
        const pillH = 4.2;
        const pillX = textX;
        const pillY = cardY + CARD_H - pillH - 2.2;

        let pillBg: [number, number, number] = [240, 253, 244]; // light success
        let pillText: [number, number, number] = [22, 163, 74];  // green
        if (stockNum < 0) {
            pillBg = [254, 242, 242]; // light red
            pillText = [220, 38, 38]; // danger red
        } else if (stockNum === 0) {
            pillBg = [243, 244, 246]; // light gray
            pillText = [107, 114, 128]; // gray-500
        }

        doc.setFillColor(...pillBg);
        doc.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'F');

        doc.setTextColor(...pillText);
        doc.text(stockStr, pillX + 2, pillY + 3.0);
    });

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
        labels.productName || 'Article',
        labels.stock || 'Stock',
        labels.category || 'Catégorie',
        labels.reference || 'Référence',
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows = products.map((p) => {
        const stock = toAmount(p.stockQty);
        const ref = p.barcode || p.reference || '';

        return [
            escapeCsv(p.name),
            escapeCsv(stock),
            escapeCsv(p.category?.name || ''),
            escapeCsv(ref),
        ].join(';');
    });

    // \uFEFF BOM ensures Excel interprets UTF-8 characters properly
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

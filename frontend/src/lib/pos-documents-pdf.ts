import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
    COMPANY,
    formatPosDate,
    formatPosDateTime,
    formatSaleNumber,
    formatSubscriptionNumber,
    personName,
    subscriptionCardUrl,
    toAmount,
    type DocumentClient,
    type DocumentLine,
    type InvoiceDetail,
    type PosPaymentMethod,
    type SaleOrderDetail,
    type SalesDetailsReport,
    type SubscriptionDetail,
} from '@/lib/pos-api';
import { taxesByRate } from '@/lib/pos-documents';

export interface PosPdfLabels {
    quotation: string;
    order: string;
    invoice: string;
    creditNote: string;
    draft: string;
    quotationDate: string;
    orderDate: string;
    validUntil: string;
    salesperson: string;
    invoiceDate: string;
    dueDate: string;
    source: string;
    description: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    discountAmount: string;
    discountShort: string;
    product: string;
    name: string;
    taxAmount: string;
    baseAmount: string;
    noTax: string;
    taxes: string;
    amount: string;
    untaxed: string;
    vat: string;
    stampDuty: string;
    total: string;
    amountPaid: string;
    amountDue: string;
    paymentReference: string;
    taxId: string;
    cin: string;
    salesDetails: string;
    period: string;
    products: string;
    payments: string;
    base: string;
    ordersCount: string;
    page: string;
    pageOf: string;
    subscription: string;
    subscriptionDate: string;
    client: string;
    phone: string;
    email: string;
    website: string;
    units: string;
    periodFrom: string;
    periodTo: string;
    followUs: string;
    scanQr: string;
    memberCard: string;
    memberCardHint: string;
    methods: Record<PosPaymentMethod, string>;
    address?: string;
}

type Rgb = [number, number, number];
type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const PRIMARY: Rgb = [37, 49, 101];
const PRIMARY_LIGHT: Rgb = [237, 240, 247];
const SUB_LEFT = 10.2;
const SUB_RIGHT = 199.6;
const SUB_BLACK: Rgb = [0, 0, 0];
const SUB_DARK: Rgb = [33, 37, 41];
const SUB_TEXT: Rgb = [73, 80, 87];
const SUB_MUTED: Rgb = [108, 117, 125];
const SUB_BORDER: Rgb = [222, 226, 230];
const SUB_STRIPE: Rgb = [248, 245, 247];
const SUB_SEPARATOR: Rgb = [233, 236, 239];
const SUB_TOTAL_LINE: Rgb = [206, 212, 218];
const SUB_FOOTER_FILL: Rgb = [248, 249, 250];
const SUB_FONT = 9;
const SUB_FOOTER_TOP = 257;
const SUB_FOOTER_HEIGHT = 33;
const SUB_CONTENT_BOTTOM = SUB_FOOTER_TOP - 7;

/** Large enough (with a white quiet zone) for phones to scan reliably from paper. */
const SOCIAL_QR_SIZE = 20;
const SOCIAL_CARD_PADDING = 2;
const SOCIAL_CARD_GAP = 4;

interface SocialQr {
    label: string;
    color: Rgb;
    data: string;
}

type SocialQrStyle = 'instagram' | 'facebook';

const QR_CANVAS_SIZE = 600;
const QR_QUIET_ZONE = 2;

function decimal(value: number, digits: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        .format(value)
        .replace(/\s/g, ' ');
}

function quantity(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
}

function subText(doc: jsPDF, color: Rgb, size = SUB_FONT, weight: 'bold' | 'normal' | 'italic' = 'bold'): void {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
}

function fileSafe(value: string): string {
    return value.replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

function documentTaxes(lines: DocumentLine[]) {
    return taxesByRate(
        lines.map((line) => ({
            taxRate: toAmount(line.taxRate),
            subtotal: toAmount(line.subtotal),
            taxAmount: toAmount(line.taxAmount),
        })),
    );
}

async function loadImage(url: string): Promise<{ data: string; width: number; height: number } | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
        const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = reject;
            img.src = data;
        });
        return { data, ...size };
    } catch {
        return null;
    }
}

function fillFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, rounded: boolean): void {
    const radius = (value: number) => (rounded ? value * cell : 0);
    ctx.beginPath();
    ctx.roundRect(x, y, 7 * cell, 7 * cell, radius(2.2));
    ctx.roundRect(x + cell, y + cell, 5 * cell, 5 * cell, radius(1.5));
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.roundRect(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell, radius(1));
    ctx.fill();
}

function drawInstagramGlyph(ctx: CanvasRenderingContext2D, center: number, size: number): void {
    ctx.lineWidth = size * 0.11;
    ctx.beginPath();
    ctx.roundRect(center - size / 2, center - size / 2, size, size, size * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center + size * 0.26, center - size * 0.26, size * 0.065, 0, Math.PI * 2);
    ctx.fill();
}

/** Instagram: gradient dots with the logo in the middle (needs error correction H); Facebook: classic black modules. */
function styledQrDataUrl(url: string, style: SocialQrStyle): string {
    const instagram = style === 'instagram';
    const { modules } = QRCode.create(url, { errorCorrectionLevel: instagram ? 'H' : 'M' });
    const count = modules.size;
    const cell = QR_CANVAS_SIZE / (count + QR_QUIET_ZONE * 2);
    const offset = QR_QUIET_ZONE * cell;
    const canvas = document.createElement('canvas');
    canvas.width = QR_CANVAS_SIZE;
    canvas.height = QR_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, QR_CANVAS_SIZE, QR_CANVAS_SIZE);
    if (instagram) {
        const gradient = ctx.createLinearGradient(0, QR_CANVAS_SIZE, QR_CANVAS_SIZE, 0);
        gradient.addColorStop(0, '#f77737');
        gradient.addColorStop(0.5, '#e1306c');
        gradient.addColorStop(1, '#833ab4');
        ctx.fillStyle = gradient;
        ctx.strokeStyle = gradient;
    } else {
        ctx.fillStyle = '#000000';
    }

    const logoModules = instagram ? Math.round(count * 0.24) | 1 : 0;
    const logoStart = (count - logoModules) / 2;
    const isFinder = (row: number, col: number) =>
        (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);
    const isLogo = (row: number, col: number) =>
        row >= logoStart && row < logoStart + logoModules && col >= logoStart && col < logoStart + logoModules;

    for (let row = 0; row < count; row += 1) {
        for (let col = 0; col < count; col += 1) {
            if (!modules.get(row, col) || isFinder(row, col) || isLogo(row, col)) continue;
            const x = offset + col * cell;
            const y = offset + row * cell;
            if (instagram) {
                ctx.beginPath();
                ctx.arc(x + cell / 2, y + cell / 2, cell * 0.46, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
            }
        }
    }

    for (const [row, col] of [[0, 0], [0, count - 7], [count - 7, 0]]) {
        fillFinderPattern(ctx, offset + col * cell, offset + row * cell, cell, instagram);
    }
    if (instagram) drawInstagramGlyph(ctx, QR_CANVAS_SIZE / 2, logoModules * cell * 0.72);

    return canvas.toDataURL('image/png');
}

function subscriptionSocialQrCodes(): SocialQr[] {
    const links = [
        { label: 'Instagram', color: [232, 111, 54] as Rgb, style: 'instagram' as const, url: COMPANY.instagramUrl },
        { label: 'Facebook', color: [43, 57, 110] as Rgb, style: 'facebook' as const, url: COMPANY.facebookUrl },
    ].filter((link): link is { label: string; color: Rgb; style: SocialQrStyle; url: string } => !!link.url);
    return links.map((link) => ({ label: link.label, color: link.color, data: styledQrDataUrl(link.url, link.style) }));
}

async function drawDocumentHeader(doc: jsPDF): Promise<number> {
    const logo = await loadImage(COMPANY.logoUrl);
    if (logo) {
        const ratio = Math.min(32.4 / logo.width, 20.4 / logo.height);
        const format = logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logo.data, format, SUB_LEFT, 4.8, logo.width * ratio, logo.height * ratio);
    }
    subText(doc, PRIMARY, 10, 'bold');
    doc.text(COMPANY.name.toUpperCase(), 46.1, 8.6);

    const lines = [
        COMPANY.addressLine,
        [COMPANY.city, COMPANY.country].filter(Boolean).join(', '),
        COMPANY.taxId ? `MF : ${COMPANY.taxId}` : null,
    ].filter((line): line is string => !!line);

    subText(doc, SUB_TEXT, 8.5, 'normal');
    lines.forEach((line, index) => doc.text(line, 46.1, 13.8 + index * 4.8));

    const separatorY = 30.4;
    doc.setDrawColor(...SUB_SEPARATOR);
    doc.setLineWidth(0.2);
    doc.line(SUB_LEFT, separatorY, SUB_RIGHT, separatorY);
    return separatorY;
}

function drawDocumentClientBox(
    doc: jsPDF,
    client: DocumentClient,
    tableTop: number,
    labels: PosPdfLabels,
): number {
    const addressLabel = labels.address || (labels.invoice === 'Facture' ? 'Adresse' : 'Address');
    const clientRows: [string, string][] = [
        [labels.client, personName(client)],
        client.address ? [addressLabel, client.address] : null,
        client.phone ? [labels.phone, client.phone] : null,
        client.email ? [labels.email, client.email] : null,
        client.taxId ? [labels.taxId || 'MF', client.taxId] : null,
        client.cin ? [labels.cin || 'CIN', client.cin] : null,
    ].filter((row): row is [string, string] => row !== null);

    const valueX = 42.4;
    const valueMaxWidth = SUB_RIGHT - valueX - 2.5;
    let currentY = tableTop;

    const rowHeights: number[] = clientRows.map(([, value]) => {
        const lines = doc.splitTextToSize(value, valueMaxWidth) as string[];
        return Math.max(6.2, 2.8 + lines.length * 3.8);
    });

    clientRows.forEach(([label, value], index) => {
        const rowHeight = rowHeights[index];
        if (index % 2 === 0) {
            doc.setFillColor(...SUB_STRIPE);
            doc.rect(SUB_LEFT, currentY, SUB_RIGHT - SUB_LEFT, rowHeight, 'F');
        }
        subText(doc, SUB_BLACK, 8.5, 'bold');
        doc.text(`${label} :`, SUB_LEFT + 1.2, currentY + 4.4);

        subText(doc, SUB_TEXT, 8.5, 'normal');
        const wrapped = doc.splitTextToSize(value, valueMaxWidth) as string[];
        doc.text(wrapped, valueX + 1.2, currentY + 4.4);

        currentY += rowHeight;
    });

    const tableBottom = currentY;
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);

    let lineCursor = tableTop;
    doc.line(SUB_LEFT, lineCursor, SUB_RIGHT, lineCursor);
    for (let index = 0; index < clientRows.length; index += 1) {
        lineCursor += rowHeights[index];
        doc.line(SUB_LEFT, lineCursor, SUB_RIGHT, lineCursor);
    }
    doc.line(SUB_LEFT, tableTop, SUB_LEFT, tableBottom);
    doc.line(valueX, tableTop, valueX, tableBottom);
    doc.line(SUB_RIGHT, tableTop, SUB_RIGHT, tableBottom);

    return tableBottom;
}

function drawSubscriptionFooters(doc: jsPDF, socialQrCodes: SocialQr[], labels: PosPdfLabels): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const totalPages = doc.getNumberOfPages();
    const panelBottom = SUB_FOOTER_TOP + SUB_FOOTER_HEIGHT;
    const contact = [
        { label: labels.phone, value: COMPANY.phone },
        { label: labels.email, value: COMPANY.email },
        { label: labels.website, value: COMPANY.website },
    ].filter((row): row is { label: string; value: string } => !!row.value);
    const cardWidth = SOCIAL_QR_SIZE + SOCIAL_CARD_PADDING * 2;
    const cardHeight = SOCIAL_QR_SIZE + SOCIAL_CARD_PADDING + 6.5;
    const cardTop = SUB_FOOTER_TOP + (SUB_FOOTER_HEIGHT - cardHeight) / 2;
    const cardsLeft = SUB_RIGHT - 4 - socialQrCodes.length * cardWidth - (socialQrCodes.length - 1) * SOCIAL_CARD_GAP;
    const textLeft = SUB_LEFT + 6;

    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFillColor(...SUB_FOOTER_FILL);
        doc.setDrawColor(...SUB_BORDER);
        doc.setLineWidth(0.2);
        doc.roundedRect(SUB_LEFT, SUB_FOOTER_TOP, SUB_RIGHT - SUB_LEFT, SUB_FOOTER_HEIGHT, 3, 3, 'FD');

        subText(doc, PRIMARY, 9.5);
        doc.text(COMPANY.name.toUpperCase(), textLeft, SUB_FOOTER_TOP + 8);
        subText(doc, SUB_DARK, 8);
        const valueX = textLeft + Math.max(0, ...contact.map((row) => doc.getTextWidth(`${row.label} :`))) + 2.5;
        contact.forEach((row, index) => {
            const y = SUB_FOOTER_TOP + 14 + index * 5.5;
            subText(doc, SUB_DARK, 8);
            doc.text(`${row.label} :`, textLeft, y);
            subText(doc, SUB_TEXT, 8, 'normal');
            doc.text(row.value, valueX, y);
        });

        if (socialQrCodes.length > 0) {
            const captionX = cardsLeft - 5;
            const middle = SUB_FOOTER_TOP + SUB_FOOTER_HEIGHT / 2;
            subText(doc, PRIMARY, 9);
            doc.text(labels.followUs, captionX, middle - 1, { align: 'right' });
            subText(doc, SUB_MUTED, 7.5, 'normal');
            doc.text(labels.scanQr, captionX, middle + 3.5, { align: 'right' });
        }

        socialQrCodes.forEach((qr, index) => {
            const x = cardsLeft + index * (cardWidth + SOCIAL_CARD_GAP);
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...SUB_BORDER);
            doc.roundedRect(x, cardTop, cardWidth, cardHeight, 2, 2, 'FD');
            doc.addImage(qr.data, 'PNG', x + SOCIAL_CARD_PADDING, cardTop + SOCIAL_CARD_PADDING, SOCIAL_QR_SIZE, SOCIAL_QR_SIZE);
            subText(doc, qr.color, 7.5);
            doc.text(qr.label, x + cardWidth / 2, cardTop + cardHeight - 2.2, { align: 'center' });
        });

        subText(doc, SUB_MUTED, 7.5, 'normal');
        doc.text(`${labels.page}: ${page} ${labels.pageOf} ${totalPages}`, pageWidth / 2, panelBottom + 4.5, { align: 'center' });
    }
}

export async function printSaleOrderPdf(
    order: SaleOrderDetail,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithAutoTable;
    const socialQrCodes = subscriptionSocialQrCodes();
    const number = formatSaleNumber(order.number);
    const isOrder = order.status === 'CONFIRMED';
    const kind = isOrder ? labels.order : labels.quotation;
    const title = `${kind} # ${number}`;

    // 1. Header
    await drawDocumentHeader(doc);

    // 2. Client Box
    const clientBoxBottom = drawDocumentClientBox(doc, order.client, 36.5, labels);

    // 3. Title & Status Badge
    let y = clientBoxBottom + 9.5;
    subText(doc, PRIMARY, 17, 'bold');
    doc.text(title, SUB_LEFT, y);

    let badgeText = isOrder ? 'CONFIRMÉ' : 'DEVIS';
    let badgeFill: Rgb = isOrder ? [240, 253, 244] : [243, 244, 246];
    let badgeTextColor: Rgb = isOrder ? [22, 101, 52] : [75, 85, 99];
    let badgeBorderColor: Rgb = isOrder ? [187, 247, 208] : [209, 213, 219];

    if (order.status === 'CANCELLED') {
        badgeText = 'ANNULÉ';
        badgeFill = [254, 242, 242];
        badgeTextColor = [185, 28, 28];
        badgeBorderColor = [254, 202, 202];
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const badgePaddingX = 3.8;
    const badgeTextWidth = doc.getTextWidth(badgeText);
    const badgeWidth = badgeTextWidth + badgePaddingX * 2;
    const badgeHeight = 5.6;
    const badgeX = SUB_RIGHT - badgeWidth;
    const badgeY = y - 4.6;

    doc.setFillColor(...badgeFill);
    doc.setDrawColor(...badgeBorderColor);
    doc.setLineWidth(0.2);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(...badgeTextColor);
    doc.text(badgeText, badgeX + badgeWidth / 2, badgeY + 3.9, { align: 'center' });

    // 4. Metadata
    y += 9.5;
    const infos: { label: string; value: string }[] = [
        {
            label: isOrder ? labels.orderDate : labels.quotationDate,
            value: formatPosDate(order.confirmedAt ?? order.orderDate),
        },
        ...(!isOrder && order.validUntil ? [{ label: labels.validUntil, value: formatPosDate(order.validUntil) }] : []),
        ...(order.salesperson ? [{ label: labels.salesperson, value: personName(order.salesperson) }] : []),
    ];

    const colWidth = (SUB_RIGHT - SUB_LEFT) / Math.max(infos.length, 1);
    infos.forEach((info, index) => {
        const x = SUB_LEFT + index * colWidth;
        subText(doc, SUB_BLACK, 8.5, 'bold');
        doc.text(`${info.label} :`, x, y);
        subText(doc, SUB_TEXT, 8.5, 'normal');
        doc.text(info.value, x, y + 4.6);
    });

    y += 10;
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);
    doc.line(SUB_LEFT, y, SUB_RIGHT, y);

    // 5. Lines Table
    const hasDiscount = order.lines.some((line) => toAmount(line.discountPct) > 0);
    const tableHead = [
        labels.description,
        labels.quantity,
        labels.unitPrice,
        ...(hasDiscount ? [labels.discount] : []),
        labels.taxes,
        labels.amount,
    ];

    const tableBody = order.lines.map((line) => [
        line.description ? `${line.productName}\n${line.description}` : line.productName,
        quantity(toAmount(line.quantity)),
        `${decimal(toAmount(line.unitPrice), 3)} DT`,
        ...(hasDiscount ? [toAmount(line.discountPct) > 0 ? `${decimal(toAmount(line.discountPct), 2)}%` : '-'] : []),
        toAmount(line.taxRate) > 0 ? `${toAmount(line.taxRate)}%` : '-',
        `${decimal(toAmount(line.subtotal), 3)} DT`,
    ]);

    const lastColIdx = tableHead.length - 1;
    autoTable(doc, {
        startY: y + 2,
        head: [tableHead],
        body: tableBody,
        margin: { left: SUB_LEFT, right: 210 - SUB_RIGHT, bottom: SUB_FOOTER_HEIGHT + 8 },
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            textColor: SUB_DARK,
            cellPadding: { top: 2.8, bottom: 2.8, left: 2.2, right: 2.2 },
            valign: 'middle',
        },
        headStyles: {
            fillColor: PRIMARY_LIGHT,
            textColor: PRIMARY,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 3.2, bottom: 3.2, left: 2.2, right: 2.2 },
            lineColor: SUB_BORDER,
            lineWidth: { bottom: 0.3 },
        },
        alternateRowStyles: {
            fillColor: SUB_STRIPE,
        },
        bodyStyles: {
            lineColor: SUB_BORDER,
            lineWidth: { bottom: 0.15 },
        },
        columnStyles: {
            0: { cellWidth: 'auto', fontStyle: 'bold' },
            1: { halign: 'right', cellWidth: 20 },
            2: { halign: 'right', cellWidth: 26 },
            ...(hasDiscount ? { 3: { halign: 'right', cellWidth: 18 } } : {}),
            [lastColIdx - 1]: { halign: 'right', cellWidth: 18 },
            [lastColIdx]: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: SUB_BLACK },
        },
    });

    let cursorY = (doc.lastAutoTable?.finalY ?? y) + 6;

    // 6. Totals & Notes
    const totalsRows: { label: string; value: string; isTotal?: boolean; isHighlight?: boolean }[] = [
        { label: labels.untaxed, value: `${decimal(toAmount(order.untaxed), 3)} DT` },
    ];
    for (const tax of documentTaxes(order.lines)) {
        totalsRows.push({
            label: `${labels.vat} ${tax.rate}%`,
            value: `${decimal(tax.tax, 3)} DT`,
        });
    }
    totalsRows.push({
        label: `${labels.total} TTC`,
        value: `${decimal(toAmount(order.total), 3)} DT`,
        isTotal: true,
    });
    if (toAmount(order.amountPaid) > 0) {
        totalsRows.push({
            label: labels.amountPaid,
            value: `${decimal(toAmount(order.amountPaid), 3)} DT`,
        });
        totalsRows.push({
            label: labels.amountDue,
            value: `${decimal(toAmount(order.total) - toAmount(order.amountPaid), 3)} DT`,
            isHighlight: true,
        });
    }

    const rowHeight = 5.8;
    const totalsCardHeight = totalsRows.length * rowHeight + 2;

    if (cursorY + totalsCardHeight > SUB_CONTENT_BOTTOM) {
        doc.addPage();
        cursorY = 25;
    }

    const totalsCardX = 115.6;
    const totalsCardWidth = SUB_RIGHT - totalsCardX;

    doc.setFillColor(...SUB_FOOTER_FILL);
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(totalsCardX, cursorY, totalsCardWidth, totalsCardHeight, 2, 2, 'FD');

    let rowY = cursorY + 1;
    totalsRows.forEach((row, index) => {
        const textY = rowY + 4.1;
        if (row.isTotal) {
            doc.setFillColor(...PRIMARY_LIGHT);
            doc.rect(totalsCardX + 0.2, rowY, totalsCardWidth - 0.4, rowHeight, 'F');
            subText(doc, PRIMARY, 9, 'bold');
        } else if (row.isHighlight) {
            doc.setFillColor(254, 242, 242);
            doc.rect(totalsCardX + 0.2, rowY, totalsCardWidth - 0.4, rowHeight, 'F');
            subText(doc, [185, 28, 28], 9, 'bold');
        } else {
            subText(doc, SUB_DARK, 8.5, index === 0 ? 'bold' : 'normal');
        }

        doc.text(row.label, totalsCardX + 3, textY);
        doc.text(row.value, SUB_RIGHT - 3, textY, { align: 'right' });

        if (index < totalsRows.length - 1) {
            doc.setDrawColor(...SUB_BORDER);
            doc.setLineWidth(0.15);
            doc.line(totalsCardX, rowY + rowHeight, SUB_RIGHT, rowY + rowHeight);
        }
        rowY += rowHeight;
    });

    if (order.note) {
        let noteY = cursorY + totalsCardHeight + 5;
        subText(doc, SUB_TEXT, 8.5, 'normal');
        for (const line of doc.splitTextToSize(order.note, SUB_RIGHT - SUB_LEFT) as string[]) {
            if (noteY > SUB_CONTENT_BOTTOM) {
                doc.addPage();
                noteY = 25;
            }
            doc.text(line, SUB_LEFT, noteY);
            noteY += 4.5;
        }
    }

    // 7. Footer
    drawSubscriptionFooters(doc, socialQrCodes, labels);

    doc.save(`${fileSafe(kind)}-${number}.pdf`);
}

export async function printInvoicePdf(
    invoice: InvoiceDetail,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithAutoTable;
    const socialQrCodes = subscriptionSocialQrCodes();
    const kind = invoice.type === 'CREDIT_NOTE' ? labels.creditNote : labels.invoice;
    const numbered = invoice.displayNumber && invoice.displayNumber !== '/';
    const title = numbered ? `${kind} # ${invoice.displayNumber}` : `${kind} (${labels.draft})`;

    // 1. Brand Header
    await drawDocumentHeader(doc);

    // 2. Client Box
    const clientBoxBottom = drawDocumentClientBox(doc, invoice.client, 36.5, labels);

    // 3. Title & Status Badge
    let y = clientBoxBottom + 9.5;
    subText(doc, PRIMARY, 17, 'bold');
    doc.text(title, SUB_LEFT, y);

    let badgeText = '';
    let badgeFill: Rgb = [243, 244, 246];
    let badgeTextColor: Rgb = [75, 85, 99];
    let badgeBorderColor: Rgb = [209, 213, 219];

    if (invoice.status === 'DRAFT') {
        badgeText = labels.draft.toUpperCase();
        badgeFill = [243, 244, 246];
        badgeTextColor = [75, 85, 99];
        badgeBorderColor = [209, 213, 219];
    } else if (invoice.status === 'CANCELLED') {
        badgeText = 'ANNULÉE';
        badgeFill = [254, 242, 242];
        badgeTextColor = [185, 28, 28];
        badgeBorderColor = [254, 202, 202];
    } else if (invoice.paymentState === 'PAID') {
        badgeText = 'PAYÉE';
        badgeFill = [240, 253, 244];
        badgeTextColor = [22, 101, 52];
        badgeBorderColor = [187, 247, 208];
    } else if (invoice.paymentState === 'PARTIAL') {
        badgeText = 'PARTIEL';
        badgeFill = [254, 243, 199];
        badgeTextColor = [180, 83, 9];
        badgeBorderColor = [253, 230, 138];
    } else {
        badgeText = 'À RÉGLER';
        badgeFill = [239, 246, 255];
        badgeTextColor = [29, 78, 216];
        badgeBorderColor = [191, 219, 254];
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const badgePaddingX = 3.8;
    const badgeTextWidth = doc.getTextWidth(badgeText);
    const badgeWidth = badgeTextWidth + badgePaddingX * 2;
    const badgeHeight = 5.6;
    const badgeX = SUB_RIGHT - badgeWidth;
    const badgeY = y - 4.6;

    doc.setFillColor(...badgeFill);
    doc.setDrawColor(...badgeBorderColor);
    doc.setLineWidth(0.2);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(...badgeTextColor);
    doc.text(badgeText, badgeX + badgeWidth / 2, badgeY + 3.9, { align: 'center' });

    // 4. Metadata
    y += 9.5;
    const infos: { label: string; value: string }[] = [
        { label: labels.invoiceDate, value: formatPosDate(invoice.invoiceDate) },
        ...(invoice.dueDate ? [{ label: labels.dueDate, value: formatPosDate(invoice.dueDate) }] : []),
        ...(invoice.saleOrder ? [{ label: labels.source, value: formatSaleNumber(invoice.saleOrder.number) }] : []),
        ...(invoice.subscription ? [{ label: labels.subscription, value: formatSubscriptionNumber(invoice.subscription.number) }] : []),
        ...(invoice.reversedInvoice && invoice.reversedInvoice.year && invoice.reversedInvoice.sequence
            ? [{ label: labels.source, value: `${labels.invoice} ${invoice.reversedInvoice.year}-${String(invoice.reversedInvoice.sequence).padStart(4, '0')}` }]
            : []),
    ];

    const colWidth = (SUB_RIGHT - SUB_LEFT) / Math.max(infos.length, 1);
    infos.forEach((info, index) => {
        const x = SUB_LEFT + index * colWidth;
        subText(doc, SUB_BLACK, 8.5, 'bold');
        doc.text(`${info.label} :`, x, y);
        subText(doc, SUB_TEXT, 8.5, 'normal');
        doc.text(info.value, x, y + 4.6);
    });

    y += 10;
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);
    doc.line(SUB_LEFT, y, SUB_RIGHT, y);

    // 5. Lines Table
    const hasDiscount = invoice.lines.some((line) => toAmount(line.discountPct) > 0);
    const tableHead = [
        labels.description,
        labels.quantity,
        labels.unitPrice,
        ...(hasDiscount ? [labels.discount] : []),
        labels.taxes,
        labels.amount,
    ];

    const tableBody = invoice.lines.map((line) => [
        line.description ? `${line.productName}\n${line.description}` : line.productName,
        quantity(toAmount(line.quantity)),
        `${decimal(toAmount(line.unitPrice), 3)} DT`,
        ...(hasDiscount ? [toAmount(line.discountPct) > 0 ? `${decimal(toAmount(line.discountPct), 2)}%` : '-'] : []),
        toAmount(line.taxRate) > 0 ? `${toAmount(line.taxRate)}%` : '-',
        `${decimal(toAmount(line.subtotal), 3)} DT`,
    ]);

    const lastColIdx = tableHead.length - 1;
    autoTable(doc, {
        startY: y + 2,
        head: [tableHead],
        body: tableBody,
        margin: { left: SUB_LEFT, right: 210 - SUB_RIGHT, bottom: SUB_FOOTER_HEIGHT + 8 },
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            textColor: SUB_DARK,
            cellPadding: { top: 2.8, bottom: 2.8, left: 2.2, right: 2.2 },
            valign: 'middle',
        },
        headStyles: {
            fillColor: PRIMARY_LIGHT,
            textColor: PRIMARY,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 3.2, bottom: 3.2, left: 2.2, right: 2.2 },
            lineColor: SUB_BORDER,
            lineWidth: { bottom: 0.3 },
        },
        alternateRowStyles: {
            fillColor: SUB_STRIPE,
        },
        bodyStyles: {
            lineColor: SUB_BORDER,
            lineWidth: { bottom: 0.15 },
        },
        columnStyles: {
            0: { cellWidth: 'auto', fontStyle: 'bold' },
            1: { halign: 'right', cellWidth: 20 },
            2: { halign: 'right', cellWidth: 26 },
            ...(hasDiscount ? { 3: { halign: 'right', cellWidth: 18 } } : {}),
            [lastColIdx - 1]: { halign: 'right', cellWidth: 18 },
            [lastColIdx]: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: SUB_BLACK },
        },
    });

    let cursorY = (doc.lastAutoTable?.finalY ?? y) + 6;

    // 6. Totals & Notes
    const totalsRows: { label: string; value: string; isTotal?: boolean; isHighlight?: boolean }[] = [
        { label: labels.untaxed, value: `${decimal(toAmount(invoice.untaxed), 3)} DT` },
    ];
    for (const tax of documentTaxes(invoice.lines)) {
        totalsRows.push({
            label: `${labels.vat} ${tax.rate}%`,
            value: `${decimal(tax.tax, 3)} DT`,
        });
    }
    if (toAmount(invoice.stampDuty) > 0) {
        totalsRows.push({
            label: labels.stampDuty,
            value: `${decimal(toAmount(invoice.stampDuty), 3)} DT`,
        });
    }
    totalsRows.push({
        label: `${labels.total} TTC`,
        value: `${decimal(toAmount(invoice.total), 3)} DT`,
        isTotal: true,
    });
    if (toAmount(invoice.amountPaid) > 0) {
        totalsRows.push({
            label: labels.amountPaid,
            value: `${decimal(toAmount(invoice.amountPaid), 3)} DT`,
        });
        totalsRows.push({
            label: labels.amountDue,
            value: `${decimal(invoice.amountDue, 3)} DT`,
            isHighlight: true,
        });
    }

    const rowHeight = 5.8;
    const totalsCardHeight = totalsRows.length * rowHeight + 2;

    if (cursorY + totalsCardHeight > SUB_CONTENT_BOTTOM) {
        doc.addPage();
        cursorY = 25;
    }

    const totalsCardX = 115.6;
    const totalsCardWidth = SUB_RIGHT - totalsCardX;

    doc.setFillColor(...SUB_FOOTER_FILL);
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(totalsCardX, cursorY, totalsCardWidth, totalsCardHeight, 2, 2, 'FD');

    let rowY = cursorY + 1;
    totalsRows.forEach((row, index) => {
        const textY = rowY + 4.1;
        if (row.isTotal) {
            doc.setFillColor(...PRIMARY_LIGHT);
            doc.rect(totalsCardX + 0.2, rowY, totalsCardWidth - 0.4, rowHeight, 'F');
            subText(doc, PRIMARY, 9, 'bold');
        } else if (row.isHighlight) {
            doc.setFillColor(254, 242, 242);
            doc.rect(totalsCardX + 0.2, rowY, totalsCardWidth - 0.4, rowHeight, 'F');
            subText(doc, [185, 28, 28], 9, 'bold');
        } else {
            subText(doc, SUB_DARK, 8.5, index === 0 ? 'bold' : 'normal');
        }

        doc.text(row.label, totalsCardX + 3, textY);
        doc.text(row.value, SUB_RIGHT - 3, textY, { align: 'right' });

        if (index < totalsRows.length - 1) {
            doc.setDrawColor(...SUB_BORDER);
            doc.setLineWidth(0.15);
            doc.line(totalsCardX, rowY + rowHeight, SUB_RIGHT, rowY + rowHeight);
        }
        rowY += rowHeight;
    });

    // Left side: Payment reference (clean, properly wrapped typography)
    if (numbered && invoice.type === 'INVOICE') {
        const refMaxWidth = totalsCardX - SUB_LEFT - 8;
        let leftY = cursorY + 4;

        subText(doc, SUB_MUTED, 8, 'normal');
        const refPrompt = doc.splitTextToSize(labels.paymentReference, refMaxWidth) as string[];
        doc.text(refPrompt, SUB_LEFT, leftY);
        leftY += refPrompt.length * 4.2;

        subText(doc, PRIMARY, 9.5, 'bold');
        doc.text(invoice.displayNumber, SUB_LEFT, leftY);
    }

    // Notes below totals
    if (invoice.note) {
        let noteY = cursorY + totalsCardHeight + 5;
        subText(doc, SUB_TEXT, 8.5, 'normal');
        for (const line of doc.splitTextToSize(invoice.note, SUB_RIGHT - SUB_LEFT) as string[]) {
            if (noteY > SUB_CONTENT_BOTTOM) {
                doc.addPage();
                noteY = 25;
            }
            doc.text(line, SUB_LEFT, noteY);
            noteY += 4.5;
        }
    }

    // 7. Footer
    drawSubscriptionFooters(doc, socialQrCodes, labels);

    doc.save(`${fileSafe(title)}.pdf`);
}

const SALES_LEFT = 10.06;
const SALES_RIGHT = 199.76;
const SALES_CELL_INSET = 0.85;
const SALES_ROW_HEIGHT = 5.29;
const SALES_HEAD_HEIGHT = 5.34;
const SALES_FONT = 10.8;
const SALES_HEADING_FONT = 19.2;
const SALES_TITLE_FONT = 21;
const SALES_PAGE_TOP = 39.9;
const SALES_CONTENT_BOTTOM = 262;
const SALES_BLACK: Rgb = [0, 0, 0];
const SALES_ROW_LINE: Rgb = [222, 226, 230];
const SALES_COLUMN_LINE: Rgb = [233, 236, 239];

interface SalesTable {
    columns: number[];
    head: string[];
    rows: string[][];
}

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function reportDateTime(value: string): string {
    const date = new Date(value);
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function shortDecimal(value: number): string {
    return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function salesText(doc: jsPDF, size = SALES_FONT): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...SALES_BLACK);
}

function fitText(doc: jsPDF, text: string, maxWidth: number): string {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let fitted = text;
    while (fitted.length > 1 && doc.getTextWidth(`${fitted}…`) > maxWidth) fitted = fitted.slice(0, -1);
    return `${fitted.trimEnd()}…`;
}

function drawSalesTableHead(doc: jsPDF, table: SalesTable, top: number): number {
    const headLine = top + SALES_HEAD_HEIGHT;
    salesText(doc);
    table.head.forEach((label, index) => {
        const center = (table.columns[index] + table.columns[index + 1]) / 2;
        doc.text(label, center, headLine - 1.41, { align: 'center' });
    });
    return headLine;
}

function drawSalesColumnLines(doc: jsPDF, columns: number[], top: number, headLine: number, bottom: number): void {
    doc.setDrawColor(...SALES_COLUMN_LINE);
    doc.setLineWidth(0.18);
    for (const x of columns) doc.line(x, top, x, bottom);
    doc.setDrawColor(...SALES_BLACK);
    doc.setLineWidth(0.4);
    doc.line(SALES_LEFT, headLine, SALES_RIGHT, headLine);
}

/** Draws an Odoo-style report table, repeating the header on each new page; returns the last row line. */
function drawSalesTable(doc: jsPDF, table: SalesTable, top: number): number {
    let segmentTop = top;
    let headLine = drawSalesTableHead(doc, table, segmentTop);
    let line = headLine;
    for (const row of table.rows) {
        if (line + SALES_ROW_HEIGHT > SALES_CONTENT_BOTTOM) {
            drawSalesColumnLines(doc, table.columns, segmentTop, headLine, line);
            doc.addPage();
            segmentTop = SALES_PAGE_TOP;
            headLine = drawSalesTableHead(doc, table, segmentTop);
            line = headLine;
        }
        salesText(doc);
        row.forEach((cell, index) => {
            const width = table.columns[index + 1] - table.columns[index] - SALES_CELL_INSET * 2;
            doc.text(fitText(doc, cell, width), table.columns[index] + SALES_CELL_INSET, line + 4);
        });
        line += SALES_ROW_HEIGHT;
        doc.setDrawColor(...SALES_ROW_LINE);
        doc.setLineWidth(0.18);
        doc.line(SALES_LEFT, line, SALES_RIGHT, line);
    }
    drawSalesColumnLines(doc, table.columns, segmentTop, headLine, line);
    return line;
}

/** Draws a section title followed by its table, moving both to a new page when they don't fit. */
function drawSalesSection(doc: jsPDF, title: string, table: SalesTable, previousBottom: number): number {
    let heading = previousBottom + 12.45;
    if (heading + 3.03 + SALES_HEAD_HEIGHT + SALES_ROW_HEIGHT > SALES_CONTENT_BOTTOM) {
        doc.addPage();
        heading = SALES_PAGE_TOP + 6;
    }
    salesText(doc, SALES_HEADING_FONT);
    doc.text(title, SALES_LEFT, heading);
    return drawSalesTable(doc, table, heading + 3.03);
}

export async function printSalesDetailsPdf(
    report: SalesDetailsReport,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const center = (SALES_LEFT + SALES_RIGHT) / 2;

    salesText(doc, SALES_TITLE_FONT);
    doc.text(labels.salesDetails, center, 46.3, { align: 'center' });
    salesText(doc);
    doc.text(`${reportDateTime(report.from)} - ${reportDateTime(report.to)}`, center, 53.5, { align: 'center' });
    salesText(doc, SALES_HEADING_FONT);
    doc.text(labels.products, SALES_LEFT, 60.3);

    let bottom = drawSalesTable(
        doc,
        {
            columns: [SALES_LEFT, 111.18, 148.94, SALES_RIGHT],
            head: [labels.product, labels.quantity, labels.unitPrice],
            rows: report.products.map((product) => [
                product.name,
                `${shortDecimal(product.quantity)} ${labels.units}`,
                product.discountPct > 0
                    ? `${shortDecimal(product.unitPrice)} ${labels.discountShort} : ${shortDecimal(product.discountPct)}%`
                    : shortDecimal(product.unitPrice),
            ]),
        },
        63.4,
    );

    bottom = drawSalesSection(
        doc,
        labels.payments,
        {
            columns: [SALES_LEFT, 95.47, SALES_RIGHT],
            head: [labels.name, labels.total],
            rows: report.payments.map((payment) => [labels.methods[payment.method], decimal(payment.total, 3)]),
        },
        bottom,
    );

    bottom = drawSalesSection(
        doc,
        labels.taxes,
        {
            columns: [SALES_LEFT, 55.94, 131.65, SALES_RIGHT],
            head: [labels.name, labels.taxAmount, labels.baseAmount],
            rows: report.taxes.map((tax) => [
                tax.rate > 0 ? `${labels.vat} ${tax.rate}%` : labels.noTax,
                decimal(tax.tax, 3),
                decimal(tax.base, 3),
            ]),
        },
        bottom,
    );

    let totalY = bottom + 14.15;
    if (totalY > SALES_CONTENT_BOTTOM) {
        doc.addPage();
        totalY = SALES_PAGE_TOP + 6;
    }
    salesText(doc);
    doc.text(`${labels.total} : ${decimal(report.total, 3)}`, SALES_LEFT, totalY);

    const printedAt = new Date();
    const printedLabel = `${printedAt.getFullYear()}-${pad2(printedAt.getMonth() + 1)}-${pad2(printedAt.getDate())} ${pad2(printedAt.getHours())}:${pad2(printedAt.getMinutes())}`;
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        salesText(doc);
        doc.text(printedLabel, SALES_LEFT, 8.7);
        doc.text(COMPANY.name.toUpperCase(), center, 8.7, { align: 'center' });
        doc.text(`${page} / ${totalPages}`, SALES_RIGHT, 8.7, { align: 'right' });
    }

    doc.save(`${fileSafe(labels.salesDetails)}-${report.from.slice(0, 10)}-${report.to.slice(0, 10)}.pdf`);
}

const MEMBER_CARD_QR_SIZE = 26;
const MEMBER_CARD_WIDTH = 88;

/** Boxed QR code linking to the member card; returns the bottom of the box. */
async function drawMemberCardQr(
    doc: jsPDF,
    subscription: SubscriptionDetail,
    labels: PosPdfLabels,
    top: number,
): Promise<number> {
    const qrCode = await QRCode.toDataURL(subscriptionCardUrl(subscription.cardToken), { margin: 1, width: 320 });
    const padding = 2.5;
    const height = MEMBER_CARD_QR_SIZE + padding * 2;
    doc.setFillColor(...SUB_FOOTER_FILL);
    doc.setDrawColor(...SUB_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(SUB_LEFT, top, MEMBER_CARD_WIDTH, height, 2, 2, 'FD');
    doc.addImage(qrCode, 'PNG', SUB_LEFT + padding, top + padding, MEMBER_CARD_QR_SIZE, MEMBER_CARD_QR_SIZE);
    const textLeft = SUB_LEFT + padding * 2 + MEMBER_CARD_QR_SIZE;
    const textWidth = MEMBER_CARD_WIDTH - (textLeft - SUB_LEFT) - padding;
    subText(doc, PRIMARY, 10);
    doc.text(labels.memberCard, textLeft, top + 8);
    subText(doc, SUB_MUTED, 8, 'normal');
    doc.text(doc.splitTextToSize(labels.memberCardHint, textWidth) as string[], textLeft, top + 13.5);
    return top + height;
}

export async function printSubscriptionPdf(subscription: SubscriptionDetail, labels: PosPdfLabels): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const socialQrCodes = subscriptionSocialQrCodes();
    const number = formatSubscriptionNumber(subscription.number);

    await drawDocumentHeader(doc);
    const tableBottom = drawDocumentClientBox(doc, subscription.client, 36.5, labels);

    let y = tableBottom + 12.6;
    subText(doc, SUB_BLACK, 18);
    doc.text(`${labels.subscription} # ${number}`, SUB_LEFT, y);

    y += 11.7;
    const infos = [
        { label: labels.subscriptionDate, value: formatPosDate(subscription.activatedAt ?? subscription.startDate) },
    ];
    infos.forEach((info, index) => {
        const x = index === 0 ? SUB_LEFT : 104.9;
        subText(doc, SUB_BLACK);
        doc.text(`${info.label} :`, x, y);
        subText(doc, SUB_TEXT);
        doc.text(info.value, x, y + 5);
    });

    y += 13.3;
    doc.setDrawColor(...SUB_BORDER);
    doc.line(SUB_LEFT, y, SUB_RIGHT, y);

    const isAmountDiscount = subscription.discountType === 'AMOUNT';
    const discount = toAmount(isAmountDiscount ? subscription.discountAmount : subscription.discountPct);
    const columns = discount > 0
        ? { quantity: 121.9, unitPrice: 150, unitPriceValue: 143.9, discount: 172, amount: 198.8 }
        : { quantity: 135, unitPrice: 172, unitPriceValue: 165.9, discount: 0, amount: 198.8 };
    const headerY = y + 4.7;
    subText(doc, SUB_BLACK);
    doc.text(labels.description, SUB_LEFT + 0.7, headerY);
    doc.text(labels.quantity, columns.quantity, headerY, { align: 'right' });
    doc.text(labels.unitPrice, columns.unitPrice, headerY, { align: 'right' });
    if (discount > 0) {
        doc.text(isAmountDiscount ? labels.discountAmount : labels.discount, columns.discount, headerY, {
            align: 'right',
        });
    }
    doc.text(labels.amount, columns.amount, headerY, { align: 'right' });

    const stripeTop = y + 6.9;
    subText(doc, SUB_TEXT);
    const productLines = doc.splitTextToSize(subscription.productName, columns.quantity - 30 - SUB_LEFT) as string[];
    const stripeHeight = 6.7 + (productLines.length - 1) * 4.2;
    doc.setFillColor(...SUB_STRIPE);
    doc.rect(SUB_LEFT, stripeTop, SUB_RIGHT - SUB_LEFT, stripeHeight, 'F');
    const rowY = stripeTop + 4.5;
    doc.text(productLines, SUB_LEFT + 0.7, rowY);
    doc.text(`${decimal(1, 2)} ${labels.units}`, columns.quantity, rowY, { align: 'right' });
    doc.text(decimal(toAmount(subscription.unitPrice), 2), columns.unitPriceValue, rowY, { align: 'right' });
    if (discount > 0) {
        doc.text(isAmountDiscount ? `${decimal(discount, 3)} DT` : decimal(discount, 2), columns.discount, rowY, {
            align: 'right',
        });
    }
    doc.text(`${decimal(toAmount(subscription.total), 3)} DT`, columns.amount, rowY, { align: 'right' });

    y = stripeTop + stripeHeight + 4.6;
    subText(doc, SUB_TEXT, 9.5);
    doc.text(
        `${labels.periodFrom} ${formatPosDate(subscription.startDate)} ${labels.periodTo} ${formatPosDate(subscription.endDate)}`,
        SUB_LEFT + 0.7,
        y,
    );

    y += 5.6;
    const cardBottom = subscription.status === 'ACTIVE' ? await drawMemberCardQr(doc, subscription, labels, y) : y;
    const totalsLeft = 105.2;
    const totals = [{ label: labels.total, value: toAmount(subscription.total) }];
    doc.setDrawColor(...SUB_TOTAL_LINE);
    doc.setLineWidth(0.3);
    doc.line(totalsLeft, y, SUB_RIGHT, y);
    subText(doc, SUB_BLACK);
    totals.forEach((row, index) => {
        y += index === 0 ? 4.8 : 6;
        doc.text(row.label, totalsLeft + 1.3, y);
        doc.text(`${decimal(row.value, 3)} DT`, columns.amount, y, { align: 'right' });
    });
    y = Math.max(y, cardBottom);

    if (subscription.note) {
        y += 10;
        subText(doc, SUB_TEXT);
        for (const line of doc.splitTextToSize(subscription.note, SUB_RIGHT - SUB_LEFT) as string[]) {
            if (y > SUB_CONTENT_BOTTOM) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, SUB_LEFT, y);
            y += 4.5;
        }
    }

    drawSubscriptionFooters(doc, socialQrCodes, labels);
    doc.save(`${fileSafe(labels.subscription)}-${number}.pdf`);
}

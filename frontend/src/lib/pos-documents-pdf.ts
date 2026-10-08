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
    methods: Record<PosPaymentMethod, string>;
}

type Rgb = [number, number, number];
type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const PRIMARY: Rgb = [37, 49, 101];
const PRIMARY_LIGHT: Rgb = [237, 240, 247];
const GRAY_900: Rgb = [33, 37, 46];
const GRAY_600: Rgb = [74, 79, 92];
const GRAY_400: Rgb = [156, 163, 175];

const MARGIN = 14;
const FOOTER_HEIGHT = 30;

function money(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(value);
}

function quantity(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
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

interface FooterQr {
    label: string;
    data: string;
}

async function footerQrCodes(): Promise<FooterQr[]> {
    const links = [
        { label: 'Web', url: COMPANY.website },
        { label: 'Instagram', url: COMPANY.instagramUrl },
        { label: 'Facebook', url: COMPANY.facebookUrl },
    ].filter((link): link is { label: string; url: string } => !!link.url);
    return Promise.all(
        links.map(async (link) => {
            const url = /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
            return { label: link.label, data: await QRCode.toDataURL(url, { margin: 0, width: 160 }) };
        }),
    );
}

async function drawCompanyHeader(doc: jsPDF): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth();
    let logoBottom = MARGIN;
    const logo = await loadImage(COMPANY.logoUrl);
    if (logo) {
        const maxWidth = 45;
        const maxHeight = 22;
        const ratio = Math.min(maxWidth / logo.width, maxHeight / logo.height);
        const width = logo.width * ratio;
        const height = logo.height * ratio;
        const format = logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logo.data, format, MARGIN, MARGIN, width, height);
        logoBottom = MARGIN + height;
    }

    const lines = [
        COMPANY.addressLine,
        [COMPANY.city, COMPANY.country].filter(Boolean).join(', '),
        COMPANY.taxId,
    ].filter((line): line is string => !!line);

    doc.setTextColor(...GRAY_900);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(COMPANY.name, pageWidth - MARGIN, MARGIN + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_600);
    lines.forEach((line, index) => doc.text(line, pageWidth - MARGIN, MARGIN + 9 + index * 4.5, { align: 'right' }));

    const bottom = Math.max(logoBottom, MARGIN + 9 + lines.length * 4.5) + 3;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, bottom, pageWidth - MARGIN, bottom);
    return bottom + 6;
}

function drawClientBlock(doc: jsPDF, client: DocumentClient, y: number, labels: PosPdfLabels): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const x = pageWidth / 2 + 10;
    const lines = [
        client.address,
        client.phone,
        client.email,
        client.cin ? `${labels.cin}: ${client.cin}` : null,
        client.taxId ? `${labels.taxId}: ${client.taxId}` : null,
    ].filter((line): line is string => !!line);
    doc.setTextColor(...GRAY_900);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(personName(client), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_600);
    let cursor = y + 5;
    for (const line of lines) {
        const wrapped = doc.splitTextToSize(line, pageWidth - MARGIN - x) as string[];
        doc.text(wrapped, x, cursor);
        cursor += wrapped.length * 4.5;
    }
    return cursor + 6;
}

function drawTitle(doc: jsPDF, title: string, y: number): number {
    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, MARGIN, y);
    return y + 9;
}

function drawInfoRow(doc: jsPDF, items: { label: string; value: string }[], y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const columnWidth = (pageWidth - MARGIN * 2) / Math.max(items.length, 1);
    items.forEach((item, index) => {
        const x = MARGIN + index * columnWidth;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...GRAY_900);
        doc.text(item.label, x, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY_600);
        doc.text(item.value, x, y + 5);
    });
    return y + 12;
}

function drawLinesTable(doc: DocWithAutoTable, lines: DocumentLine[], y: number, labels: PosPdfLabels): number {
    const hasDiscount = lines.some((line) => toAmount(line.discountPct) > 0);
    const head = [
        labels.description,
        labels.quantity,
        labels.unitPrice,
        ...(hasDiscount ? [labels.discount] : []),
        labels.taxes,
        labels.amount,
    ];
    const body = lines.map((line) => [
        line.description ? `${line.productName}\n${line.description}` : line.productName,
        quantity(toAmount(line.quantity)),
        money(toAmount(line.unitPrice)),
        ...(hasDiscount ? [toAmount(line.discountPct) ? `${toAmount(line.discountPct)}%` : ''] : []),
        toAmount(line.taxRate) ? `${labels.vat} ${toAmount(line.taxRate)}%` : '',
        money(toAmount(line.subtotal)),
    ]);
    const lastColumn = head.length - 1;
    autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_HEIGHT + 4 },
        theme: 'plain',
        styles: { fontSize: 9, textColor: GRAY_900, cellPadding: 2.2 },
        headStyles: { fillColor: PRIMARY_LIGHT, textColor: PRIMARY, fontStyle: 'bold' },
        bodyStyles: { lineColor: [229, 231, 235], lineWidth: { bottom: 0.2 } },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            [lastColumn - 1]: { halign: 'right' },
            [lastColumn]: { halign: 'right', fontStyle: 'bold' },
            ...(hasDiscount ? { 3: { halign: 'right' } } : {}),
        },
    });
    return (doc.lastAutoTable?.finalY ?? y) + 6;
}

interface TotalsRow {
    label: string;
    value: number;
    strong?: boolean;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed <= pageHeight - FOOTER_HEIGHT - 4) return y;
    doc.addPage();
    return MARGIN + 6;
}

function drawTotals(doc: jsPDF, rows: TotalsRow[], y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = pageWidth - MARGIN - 80;
    let cursor = ensureSpace(doc, y, rows.length * 6 + 4);
    for (const row of rows) {
        if (row.strong) {
            doc.setFillColor(...PRIMARY_LIGHT);
            doc.rect(left - 2, cursor - 4.2, 82, 6.4, 'F');
        }
        doc.setFont('helvetica', row.strong ? 'bold' : 'normal');
        doc.setFontSize(row.strong ? 10.5 : 9.5);
        doc.setTextColor(...(row.strong ? PRIMARY : GRAY_900));
        doc.text(row.label, left, cursor);
        doc.text(money(row.value), pageWidth - MARGIN, cursor, { align: 'right' });
        cursor += 6.5;
    }
    return cursor + 4;
}

function drawParagraph(doc: jsPDF, text: string, y: number, options: { bold?: boolean } = {}): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const wrapped = doc.splitTextToSize(text, pageWidth - MARGIN * 2) as string[];
    const cursor = ensureSpace(doc, y, wrapped.length * 4.5 + 2);
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY_900);
    doc.text(wrapped, MARGIN, cursor);
    return cursor + wrapped.length * 4.5 + 3;
}

function drawFooters(doc: jsPDF, qrCodes: FooterQr[], labels: PosPdfLabels): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPages = doc.getNumberOfPages();
    const contact = [COMPANY.phone, COMPANY.email, COMPANY.website].filter(Boolean).join('  ·  ');
    const qrSize = 14;

    for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        const top = pageHeight - FOOTER_HEIGHT;
        doc.setDrawColor(...GRAY_400);
        doc.setLineWidth(0.2);
        doc.line(MARGIN, top, pageWidth - MARGIN, top);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...GRAY_600);
        if (contact) doc.text(contact, MARGIN, top + 6);
        if (COMPANY.footerNote) {
            const note = doc.splitTextToSize(COMPANY.footerNote, pageWidth - MARGIN * 2 - qrCodes.length * (qrSize + 4)) as string[];
            doc.text(note.slice(0, 3), MARGIN, top + 11);
        }
        doc.setTextColor(...GRAY_400);
        doc.text(`${labels.page} ${page} / ${totalPages}`, MARGIN, pageHeight - 6);

        qrCodes.forEach((qr, index) => {
            const x = pageWidth - MARGIN - (qrCodes.length - index) * (qrSize + 4) + 4;
            doc.addImage(qr.data, 'PNG', x, top + 3, qrSize, qrSize);
            doc.setFontSize(6.5);
            doc.setTextColor(...GRAY_600);
            doc.text(qr.label, x + qrSize / 2, top + qrSize + 6, { align: 'center' });
        });
    }
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

export async function printSaleOrderPdf(
    order: SaleOrderDetail,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithAutoTable;
    const qrCodes = await footerQrCodes();
    const number = formatSaleNumber(order.number);
    const isOrder = order.status === 'CONFIRMED';
    const kind = isOrder ? labels.order : labels.quotation;

    let y = await drawCompanyHeader(doc);
    y = drawClientBlock(doc, order.client, y, labels);
    y = drawTitle(doc, `${kind} # ${number}`, y);
    y = drawInfoRow(
        doc,
        [
            {
                label: isOrder ? labels.orderDate : labels.quotationDate,
                value: formatPosDate(order.confirmedAt ?? order.orderDate),
            },
            ...(!isOrder && order.validUntil ? [{ label: labels.validUntil, value: formatPosDate(order.validUntil) }] : []),
            ...(order.salesperson ? [{ label: labels.salesperson, value: personName(order.salesperson) }] : []),
        ],
        y,
    );
    y = drawLinesTable(doc, order.lines, y, labels);

    const rows: TotalsRow[] = [{ label: labels.untaxed, value: toAmount(order.untaxed) }];
    for (const tax of documentTaxes(order.lines)) rows.push({ label: `${labels.vat} ${tax.rate}%`, value: tax.tax });
    rows.push({ label: labels.total, value: toAmount(order.total), strong: true });
    if (toAmount(order.amountPaid) > 0) {
        rows.push({ label: labels.amountPaid, value: toAmount(order.amountPaid) });
        rows.push({ label: labels.amountDue, value: toAmount(order.total) - toAmount(order.amountPaid), strong: true });
    }
    y = drawTotals(doc, rows, y);
    if (order.note) drawParagraph(doc, order.note, y);

    drawFooters(doc, qrCodes, labels);
    doc.save(`${fileSafe(kind)}-${number}.pdf`);
}

export async function printInvoicePdf(
    invoice: InvoiceDetail,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithAutoTable;
    const qrCodes = await footerQrCodes();
    const kind = invoice.type === 'CREDIT_NOTE' ? labels.creditNote : labels.invoice;
    const numbered = invoice.displayNumber !== '/';
    const title = numbered ? `${kind} ${invoice.displayNumber}` : `${kind} ${labels.draft}`;

    let y = await drawCompanyHeader(doc);
    y = drawClientBlock(doc, invoice.client, y, labels);
    y = drawTitle(doc, title, y);
    y = drawInfoRow(
        doc,
        [
            { label: labels.invoiceDate, value: formatPosDate(invoice.invoiceDate) },
            ...(invoice.dueDate ? [{ label: labels.dueDate, value: formatPosDate(invoice.dueDate) }] : []),
            ...(invoice.saleOrder ? [{ label: labels.source, value: formatSaleNumber(invoice.saleOrder.number) }] : []),
        ],
        y,
    );
    y = drawLinesTable(doc, invoice.lines, y, labels);

    const rows: TotalsRow[] = [{ label: labels.untaxed, value: toAmount(invoice.untaxed) }];
    for (const tax of documentTaxes(invoice.lines)) rows.push({ label: `${labels.vat} ${tax.rate}%`, value: tax.tax });
    if (toAmount(invoice.stampDuty) > 0) rows.push({ label: labels.stampDuty, value: toAmount(invoice.stampDuty) });
    rows.push({ label: labels.total, value: toAmount(invoice.total), strong: true });
    if (toAmount(invoice.amountPaid) > 0) {
        rows.push({ label: labels.amountPaid, value: toAmount(invoice.amountPaid) });
        rows.push({ label: labels.amountDue, value: invoice.amountDue, strong: true });
    }
    y = drawTotals(doc, rows, y);

    if (numbered && invoice.type === 'INVOICE') {
        y = drawParagraph(doc, `${labels.paymentReference} ${invoice.displayNumber}`, y, { bold: true });
    }
    if (invoice.note) drawParagraph(doc, invoice.note, y);

    drawFooters(doc, qrCodes, labels);
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

function decimal(value: number, digits: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        .format(value)
        .replace(/\s/g, ' ');
}

function subText(doc: jsPDF, color: Rgb, size = SUB_FONT, weight: 'bold' | 'normal' = 'bold'): void {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
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

export async function printSubscriptionPdf(subscription: SubscriptionDetail, labels: PosPdfLabels): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const logo = await loadImage(COMPANY.logoUrl);
    const socialQrCodes = subscriptionSocialQrCodes();
    const number = formatSubscriptionNumber(subscription.number);

    if (logo) {
        const ratio = Math.min(32.4 / logo.width, 20.4 / logo.height);
        const format = logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logo.data, format, SUB_LEFT, 4.8, logo.width * ratio, logo.height * ratio);
    }
    subText(doc, SUB_TEXT);
    [COMPANY.name.toUpperCase(), COMPANY.addressLine, COMPANY.city, COMPANY.country]
        .filter(Boolean)
        .forEach((line, index) => doc.text(line, 46.1, 8.6 + index * 5.07));
    doc.setDrawColor(...SUB_SEPARATOR);
    doc.setLineWidth(0.2);
    doc.line(SUB_LEFT, 30.4, SUB_RIGHT, 30.4);

    const client = subscription.client;
    const clientRows = [
        [labels.client, personName(client)],
        ...(client.phone ? [[labels.phone, client.phone]] : []),
        ...(client.cin ? [[labels.cin, client.cin]] : []),
    ];
    const tableTop = 40.1;
    const rowHeight = 6.9;
    const valueX = 42.4;
    clientRows.forEach(([label, value], index) => {
        const top = tableTop + index * rowHeight;
        if (index % 2 === 0) {
            doc.setFillColor(...SUB_STRIPE);
            doc.rect(SUB_LEFT, top, SUB_RIGHT - SUB_LEFT, rowHeight, 'F');
        }
        subText(doc, SUB_BLACK);
        doc.text(`${label} :`, SUB_LEFT + 0.7, top + 4.6);
        subText(doc, SUB_TEXT);
        doc.text(value, valueX + 0.7, top + 4.6);
    });
    const tableBottom = tableTop + clientRows.length * rowHeight;
    doc.setDrawColor(...SUB_BORDER);
    for (let index = 0; index <= clientRows.length; index += 1) {
        const lineY = tableTop + index * rowHeight;
        doc.line(SUB_LEFT, lineY, SUB_RIGHT, lineY);
    }
    doc.line(SUB_LEFT, tableTop, SUB_LEFT, tableBottom);
    doc.line(valueX, tableTop, valueX, tableBottom);
    doc.line(SUB_RIGHT, tableTop, SUB_RIGHT, tableBottom);

    let y = tableBottom + 12.6;
    subText(doc, SUB_BLACK, 18);
    doc.text(`${labels.subscription} # ${number}`, SUB_LEFT, y);

    y += 11.7;
    const infos = [
        { label: labels.subscriptionDate, value: formatPosDate(subscription.activatedAt ?? subscription.startDate) },
        ...(subscription.createdBy ? [{ label: labels.salesperson, value: personName(subscription.createdBy) }] : []),
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

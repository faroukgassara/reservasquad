import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
    COMPANY,
    formatPosDate,
    formatPosDateTime,
    formatSaleNumber,
    personName,
    toAmount,
    type DocumentClient,
    type DocumentLine,
    type InvoiceDetail,
    type PosPaymentMethod,
    type SaleOrderDetail,
    type SalesDetailsReport,
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

export async function printSalesDetailsPdf(
    report: SalesDetailsReport,
    labels: PosPdfLabels,
): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithAutoTable;
    const qrCodes = await footerQrCodes();

    let y = await drawCompanyHeader(doc);
    y = drawTitle(doc, labels.salesDetails, y);
    y = drawInfoRow(
        doc,
        [
            { label: labels.period, value: `${formatPosDateTime(report.from)} - ${formatPosDateTime(report.to)}` },
            { label: labels.ordersCount, value: String(report.ordersCount) },
        ],
        y,
    );

    const tableOptions = {
        margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_HEIGHT + 4 },
        theme: 'plain' as const,
        styles: { fontSize: 9, textColor: GRAY_900, cellPadding: 2.2 },
        headStyles: { fillColor: PRIMARY_LIGHT, textColor: PRIMARY, fontStyle: 'bold' as const },
        bodyStyles: { lineColor: [229, 231, 235] as Rgb, lineWidth: { bottom: 0.2 } },
    };

    autoTable(doc, {
        ...tableOptions,
        startY: y,
        head: [[labels.products, labels.quantity, labels.unitPrice, labels.amount]],
        body: report.products.map((product) => [
            product.name,
            quantity(product.quantity),
            money(product.unitPrice),
            money(product.total),
        ]),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;

    autoTable(doc, {
        ...tableOptions,
        startY: y,
        head: [[labels.payments, labels.amount]],
        body: report.payments.map((payment) => [labels.methods[payment.method], money(payment.total)]),
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;

    if (report.taxes.length > 0) {
        autoTable(doc, {
            ...tableOptions,
            startY: y,
            head: [[labels.taxes, labels.base, labels.amount]],
            body: report.taxes.map((tax) => [`${labels.vat} ${tax.rate}%`, money(tax.base), money(tax.tax)]),
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' } },
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 6;
    }

    drawTotals(doc, [{ label: labels.total, value: report.total, strong: true }], y + 2);
    drawFooters(doc, qrCodes, labels);
    doc.save(`${fileSafe(labels.salesDetails)}-${report.from.slice(0, 10)}-${report.to.slice(0, 10)}.pdf`);
}

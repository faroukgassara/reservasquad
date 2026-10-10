import {
    round3,
    toAmount,
    type DocumentLine,
    type DocumentLineInput,
    type InvoicePaymentState,
    type InvoiceStatus,
    type PosOrderLine,
    type PosProduct,
    type SaleOrderStatus,
    type SubscriptionDisplayStatus,
} from '@/lib/pos-api';
import { EBadgeType } from '@/Enum/Enum';

export const SALE_STATUS_BADGE: Record<SaleOrderStatus, EBadgeType> = {
    DRAFT: EBadgeType.primary,
    SENT: EBadgeType.warning,
    CONFIRMED: EBadgeType.success,
    CANCELLED: EBadgeType.error,
};

/** Register lines that pay a document store its number as their name; credit payments store the credit description. */
export function documentLineName(
    line: Pick<PosOrderLine, 'saleOrderId' | 'subscriptionId' | 'creditId' | 'invoiceId' | 'productName'>,
    t: (key: 'saleOrderLine' | 'subscriptionLine' | 'creditLine' | 'invoiceLine', values: { number: string }) => string,
): string {
    if (line.invoiceId) return t('invoiceLine', { number: line.productName });
    if (line.saleOrderId) return t('saleOrderLine', { number: line.productName });
    if (line.subscriptionId) return t('subscriptionLine', { number: line.productName });
    if (line.creditId) return t('creditLine', { number: line.productName });
    return line.productName;
}

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, EBadgeType> = {
    DRAFT: EBadgeType.primary,
    POSTED: EBadgeType.success,
    CANCELLED: EBadgeType.error,
};

export const PAYMENT_STATE_BADGE: Record<InvoicePaymentState, EBadgeType> = {
    NOT_PAID: EBadgeType.error,
    PARTIAL: EBadgeType.warning,
    PAID: EBadgeType.success,
};

export const SUBSCRIPTION_STATUS_BADGE: Record<SubscriptionDisplayStatus, EBadgeType> = {
    DRAFT: EBadgeType.primary,
    ACTIVE: EBadgeType.success,
    EXPIRING: EBadgeType.warning,
    EXPIRED: EBadgeType.error,
    CANCELLED: EBadgeType.error,
};

export interface DocumentLineDraft {
    key: string;
    productId: string | null;
    productName: string;
    description: string;
    quantity: string;
    unitPrice: string;
    discountPct: string;
    taxRate: string;
}

function parseNumber(value: string): number {
    return Number(value.replace(',', '.'));
}

let draftCounter = 0;
function nextKey(): string {
    draftCounter += 1;
    return `line-${Date.now()}-${draftCounter}`;
}

export function newDraftLine(): DocumentLineDraft {
    return {
        key: nextKey(),
        productId: null,
        productName: '',
        description: '',
        quantity: '1',
        unitPrice: '0',
        discountPct: '0',
        taxRate: '0',
    };
}

export function draftFromProduct(draft: DocumentLineDraft, product: PosProduct): DocumentLineDraft {
    return {
        ...draft,
        productId: product.id,
        productName: product.name,
        unitPrice: String(toAmount(product.price)),
        taxRate: String(toAmount(product.taxRate)),
    };
}

export function draftFromLine(line: DocumentLine): DocumentLineDraft {
    return {
        key: line.id,
        productId: line.productId,
        productName: line.productName,
        description: line.description ?? '',
        quantity: String(toAmount(line.quantity)),
        unitPrice: String(toAmount(line.unitPrice)),
        discountPct: String(toAmount(line.discountPct)),
        taxRate: String(toAmount(line.taxRate)),
    };
}

export function draftAmounts(draft: DocumentLineDraft) {
    const quantity = parseNumber(draft.quantity) || 0;
    const unitPrice = parseNumber(draft.unitPrice) || 0;
    const discountPct = parseNumber(draft.discountPct) || 0;
    const taxRate = parseNumber(draft.taxRate) || 0;
    const subtotal = round3(quantity * unitPrice * (1 - discountPct / 100));
    const taxAmount = round3((subtotal * taxRate) / 100);
    return { subtotal, taxAmount, total: round3(subtotal + taxAmount) };
}

export function draftTotals(drafts: DocumentLineDraft[]) {
    return drafts.reduce(
        (acc, draft) => {
            const amounts = draftAmounts(draft);
            return {
                untaxed: round3(acc.untaxed + amounts.subtotal),
                taxTotal: round3(acc.taxTotal + amounts.taxAmount),
                total: round3(acc.total + amounts.total),
            };
        },
        { untaxed: 0, taxTotal: 0, total: 0 },
    );
}

export function isDraftValid(draft: DocumentLineDraft): boolean {
    const quantity = parseNumber(draft.quantity);
    const unitPrice = parseNumber(draft.unitPrice);
    const discountPct = parseNumber(draft.discountPct || '0');
    return (
        draft.productName.trim() !== '' &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        Number.isFinite(unitPrice) &&
        unitPrice >= 0 &&
        Number.isFinite(discountPct) &&
        discountPct >= 0 &&
        discountPct <= 100
    );
}

export function draftToInput(draft: DocumentLineDraft): DocumentLineInput {
    return {
        productId: draft.productId,
        productName: draft.productName.trim(),
        description: draft.description.trim() || null,
        quantity: parseNumber(draft.quantity),
        unitPrice: parseNumber(draft.unitPrice),
        discountPct: parseNumber(draft.discountPct || '0'),
        taxRate: parseNumber(draft.taxRate || '0'),
    };
}

/** Groups tax amounts by rate, for the totals block and printed documents. */
export function taxesByRate(lines: { taxRate: number; subtotal: number; taxAmount: number }[]) {
    const byRate = new Map<number, { rate: number; base: number; tax: number }>();
    for (const line of lines) {
        if (line.taxRate <= 0) continue;
        const entry = byRate.get(line.taxRate) ?? { rate: line.taxRate, base: 0, tax: 0 };
        entry.base = round3(entry.base + line.subtotal);
        entry.tax = round3(entry.tax + line.taxAmount);
        byRate.set(line.taxRate, entry);
    }
    return [...byRate.values()].sort((a, b) => a.rate - b.rate);
}

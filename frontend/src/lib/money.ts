const amountFormatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

/**
 * TND amount with a full-width non-breaking space between thousands, e.g. "20 877,630 DT".
 * fr-* locales use a narrow no-break space (U+202F) that is hard to read in bold digits.
 */
export function formatMoney(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(amount)) return String(value);
    return `${amountFormatter.format(amount).replace(/[\u202F\u00A0\s]/g, '\u00A0')}\u00A0DT`;
}

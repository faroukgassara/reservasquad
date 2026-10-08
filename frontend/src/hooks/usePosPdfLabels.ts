import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { PosPdfLabels } from '@/lib/pos-documents-pdf';

const LABEL_KEYS = [
    'quotation',
    'order',
    'invoice',
    'creditNote',
    'draft',
    'quotationDate',
    'orderDate',
    'validUntil',
    'salesperson',
    'invoiceDate',
    'dueDate',
    'source',
    'description',
    'quantity',
    'unitPrice',
    'discount',
    'discountAmount',
    'discountShort',
    'product',
    'name',
    'taxAmount',
    'baseAmount',
    'noTax',
    'taxes',
    'amount',
    'untaxed',
    'vat',
    'stampDuty',
    'total',
    'amountPaid',
    'amountDue',
    'paymentReference',
    'taxId',
    'cin',
    'salesDetails',
    'period',
    'products',
    'payments',
    'base',
    'ordersCount',
    'page',
    'pageOf',
    'subscription',
    'subscriptionDate',
    'client',
    'phone',
    'email',
    'website',
    'units',
    'periodFrom',
    'periodTo',
    'followUs',
    'scanQr',
] as const;

export function usePosPdfLabels(): PosPdfLabels {
    const t = useTranslations('pos.pdf');
    const tMethod = useTranslations('pos.methods');

    return useMemo(() => {
        const labels = {
            methods: { CASH: tMethod('CASH'), BANK: tMethod('BANK'), CLIENT_ACCOUNT: tMethod('CLIENT_ACCOUNT') },
        } as PosPdfLabels;
        for (const key of LABEL_KEYS) labels[key] = t(key);
        return labels;
    }, [t, tMethod]);
}

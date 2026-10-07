'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import { useCurrentModal } from '@/contexts/ModalContext';
import { formatMoney } from '@/lib/daily-income-api';
import {
    fetchInvoices,
    fetchSubscriptions,
    formatPosDate,
    formatSubscriptionNumber,
    personName,
    round3,
    toAmount,
    type PosClientRef,
} from '@/lib/pos-api';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel } from '@/Enum/Enum';

export type DocumentPaymentKind = 'settle' | 'deposit';
export type PayableDocumentSource = 'invoice' | 'subscription';

export interface PayableDocument {
    id: string;
    number: string;
    caption: string;
    client: PosClientRef;
    total: number;
    amountPaid: number;
}

interface PosDocumentPickerModalProps {
    source: PayableDocumentSource;
    onSelect: (selection: { document: PayableDocument; amount: number; kind: DocumentPaymentKind }) => void;
}

function remainingOf(document: PayableDocument): number {
    return round3(document.total - document.amountPaid);
}

async function fetchPayableDocuments(source: PayableDocumentSource, search?: string): Promise<PayableDocument[]> {
    const params = { page: 1, perPage: 30, payable: true, search };
    if (source === 'subscription') {
        const { data } = await fetchSubscriptions(params);
        return data.map((subscription) => ({
            id: subscription.id,
            number: formatSubscriptionNumber(subscription.number),
            caption: `${subscription.productName} · ${formatPosDate(subscription.startDate)} - ${formatPosDate(subscription.endDate)}`,
            client: subscription.client,
            total: toAmount(subscription.total),
            amountPaid: toAmount(subscription.amountPaid),
        }));
    }
    const { data } = await fetchInvoices(params);
    return data.map((invoice) => ({
        id: invoice.id,
        number: invoice.displayNumber,
        caption: formatPosDate(invoice.invoiceDate),
        client: invoice.client,
        total: toAmount(invoice.total),
        amountPaid: toAmount(invoice.amountPaid),
    }));
}

export default function PosDocumentPickerModal({ source, onSelect }: Readonly<PosDocumentPickerModalProps>) {
    const t = useTranslations('pos.saleOrderPicker');
    const tSource = useTranslations(source === 'subscription' ? 'pos.subscriptionPicker' : 'pos.invoicePicker');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selected, setSelected] = useState<PayableDocument | null>(null);
    const [kind, setKind] = useState<DocumentPaymentKind>('settle');
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: documents = [], isLoading } = useQuery({
        queryKey: [source === 'subscription' ? 'subscriptions' : 'invoices', 'payable', debouncedSearch],
        queryFn: () => fetchPayableDocuments(source, debouncedSearch || undefined),
    });

    const depositCreditHint = (document: PayableDocument) => {
        const value = Number(amount.replace(',', '.'));
        const deposit = Number.isFinite(value) && value > 0 ? value : 0;
        return t('depositCreditHint', { value: formatMoney(Math.max(0, round3(remainingOf(document) - deposit))) });
    };

    const confirm = () => {
        if (!selected) return;
        const remaining = remainingOf(selected);
        if (kind === 'settle') {
            onSelect({ document: selected, amount: remaining, kind });
            closeModal();
            return;
        }
        const value = Number(amount.replace(',', '.'));
        if (!Number.isFinite(value) || value <= 0) {
            setAmountError(t('invalidAmount'));
            return;
        }
        if (value > remaining + 0.0005) {
            setAmountError(t('amountExceeds', { value: formatMoney(remaining) }));
            return;
        }
        onSelect({ document: selected, amount: round3(value), kind });
        closeModal();
    };

    return (
        <Modal
            title={tSource('title')}
            subTitle={tSource('subtitle')}
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,560px)]"
        >
            <Div className="flex flex-col gap-4">
                {selected ? (
                    <Div className="space-y-4">
                        <Div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block font-semibold">
                                {`${selected.number} · ${personName(selected.client)}`}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                                {t('amounts', {
                                    total: formatMoney(selected.total),
                                    remaining: formatMoney(remainingOf(selected)),
                                })}
                            </Label>
                        </Div>
                        <Tabs
                            variant="pills"
                            options={[
                                { value: 'settle', label: tSource('settle') },
                                { value: 'deposit', label: t('deposit') },
                            ]}
                            value={kind}
                            onChange={(value) => {
                                setKind(value as DocumentPaymentKind);
                                setAmountError(null);
                            }}
                            className="w-full"
                        />
                        <Div className="grid">
                            <Div className={twMerge('col-start-1 row-start-1', kind !== 'deposit' && 'invisible')}>
                                <Input
                                    id="pos-document-deposit"
                                    label={t('depositAmount')}
                                    type={EInputType.number}
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setAmountError(null);
                                    }}
                                    hintText={amountError ?? depositCreditHint(selected)}
                                    error={!!amountError}
                                />
                            </Div>
                            <Div className={twMerge('col-start-1 row-start-1', kind !== 'settle' && 'invisible')}>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                    {t('settleHint', { value: formatMoney(remainingOf(selected)) })}
                                </Label>
                            </Div>
                        </Div>
                        <Div className="flex gap-3">
                            <Button
                                id="pos-document-back"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={tCommon('back')}
                                onClick={() => setSelected(null)}
                                className="flex-1"
                            />
                            <Button
                                id="pos-document-confirm"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={t('addToOrder')}
                                onClick={confirm}
                                className="flex-1"
                            />
                        </Div>
                    </Div>
                ) : (
                    <>
                        <Input
                            id="pos-document-search"
                            leftIcon="search"
                            placeholder={tSource('search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Div className="max-h-[50dvh] min-h-40 space-y-1 overflow-y-auto">
                            {isLoading ? (
                                <Div className="flex justify-center py-8">
                                    <Spinner size={ESize.lg} color="text-primary-500" />
                                </Div>
                            ) : null}
                            {!isLoading && documents.length === 0 ? (
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="py-6">
                                    {tSource('empty')}
                                </Label>
                            ) : null}
                            {documents.map((document) => (
                                <button
                                    key={document.id}
                                    type="button"
                                    onClick={() => {
                                        setSelected(document);
                                        setKind('settle');
                                        setAmount('');
                                        setAmountError(null);
                                    }}
                                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                                >
                                    <Div className="flex min-w-0 flex-col">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                            {`${document.number} · ${personName(document.client)}`}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                            {document.caption}
                                        </Label>
                                    </Div>
                                    <Div className="flex shrink-0 flex-col items-end">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                                            {formatMoney(document.total)}
                                        </Label>
                                        {document.amountPaid > 0 ? (
                                            <Label variant={EVariantLabel.caption} color="text-warning-600" className="tabular-nums">
                                                {t('remaining', { value: formatMoney(remainingOf(document)) })}
                                            </Label>
                                        ) : null}
                                    </Div>
                                </button>
                            ))}
                        </Div>
                    </>
                )}
            </Div>
        </Modal>
    );
}

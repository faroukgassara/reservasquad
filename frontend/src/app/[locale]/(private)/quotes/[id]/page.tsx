'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import DocumentLinesEditor, { EMPTY_LINE } from '@/components/Primitives/DocumentLinesEditor/DocumentLinesEditor';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    EInputType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import {
    convertQuoteToInvoice,
    fetchAllCustomers,
    fetchQuote,
    formatMoney,
    updateQuote,
    type DocumentLineInput,
    type QuoteStatus,
} from '@/lib/sales-api';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import Badge from '@/components/Primitives/Badge/Badge';

const EDITABLE_QUOTE_STATUSES: Set<QuoteStatus> = new Set(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']);

function isEditableQuoteStatus(value: string | number | (string | number)[]): value is QuoteStatus {
    return typeof value === 'string' && EDITABLE_QUOTE_STATUSES.has(value as QuoteStatus);
}

function quoteStatusColor(status: QuoteStatus): EBadgeType {
    switch (status) {
        case 'ACCEPTED':
        case 'CONVERTED':
            return EBadgeType.success;
        case 'SENT':
            return EBadgeType.primary;
        case 'REJECTED':
        case 'EXPIRED':
            return EBadgeType.error;
        default:
            return EBadgeType.warning;
    }
}

function linesFromQuote(lines: { label: string; description?: string | null; quantity: string | number; unitPrice: string | number; taxRate: string | number }[]): DocumentLineInput[] {
    if (!lines.length) return [{ ...EMPTY_LINE }];
    return lines.map((l) => ({
        label: l.label,
        description: l.description ?? '',
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate),
    }));
}

export default function QuoteDetailPage() {
    const t = useTranslations('sales.quotes');
    const tInvoices = useTranslations('sales.invoices');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const quoteStatusLabel = (status: QuoteStatus): string => {
        const map: Partial<Record<QuoteStatus, string>> = {
            DRAFT: tStatus('draft'),
            SENT: tStatus('sent'),
            ACCEPTED: tStatus('accepted'),
            REJECTED: tStatus('rejected'),
        };
        return map[status] ?? status;
    };

    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const { openToast } = useToast();
    const queryClient = useQueryClient();

    const [customerId, setCustomerId] = useState('');
    const [status, setStatus] = useState<QuoteStatus>('DRAFT');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<DocumentLineInput[]>([{ ...EMPTY_LINE }]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Dashboard);
    }, [isAdmin, router]);

    const { data: quote, isLoading } = useQuery({
        queryKey: ['quote', id],
        queryFn: () => fetchQuote(id),
        enabled: isAdmin && !!id,
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers-all'],
        queryFn: fetchAllCustomers,
        enabled: isAdmin,
    });

    const customerOptions = useMemo(
        () =>
            customers.map((c) => ({
                value: c.id,
                label: c.company ? `${c.name} — ${c.company}` : c.name,
            })),
        [customers],
    );

    const statusOptions = useMemo(
        () => [
            { value: 'DRAFT' as const, label: tStatus('draft') },
            { value: 'SENT' as const, label: tStatus('sent') },
            { value: 'ACCEPTED' as const, label: tStatus('accepted') },
            { value: 'REJECTED' as const, label: tStatus('rejected') },
        ],
        [tStatus],
    );

    useEffect(() => {
        if (!quote || initialized) return;
        setCustomerId(quote.customerId);
        setStatus(quote.status);
        setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : '');
        setNotes(quote.notes ?? '');
        setLines(linesFromQuote(quote.lines ?? []));
        setInitialized(true);
    }, [quote, initialized]);

    const isLocked = quote?.status === 'CONVERTED';

    const updateMutation = useMutation({
        mutationFn: () => {
            const validLines = lines.filter((l) => l.label.trim());
            return updateQuote(id, {
                customerId,
                status,
                validUntil: validUntil || undefined,
                notes: notes.trim() || undefined,
                lines: validLines.map((l) => ({
                    label: l.label.trim(),
                    description: l.description?.trim() || undefined,
                    quantity: Number(l.quantity) || 0,
                    unitPrice: Number(l.unitPrice) || 0,
                    taxRate: Number(l.taxRate) || 0,
                })),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote', id] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const convertMutation = useMutation({
        mutationFn: () => convertQuoteToInvoice(id),
        onSuccess: (invoice) => {
            queryClient.invalidateQueries({ queryKey: ['quote', id] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), invoice.number, { type: EToastType.SUCCESS });
            router.push(Routes.Invoices.show(invoice.id));
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    const handleSubmit = async () => {
        if (isLocked) return;
        if (!customerId) {
            openToast(tCommon('error'), t('customer'), { type: EToastType.ERROR });
            return;
        }
        await updateMutation.mutateAsync();
    };

    if (!isAdmin) return null;

    if (isLoading || !quote) {
        return (
            <LayoutWrapper
                title={t('title')}
                subTitle={tCommon('loading')}
                mainSection={<Div className="p-8 text-center text-gray-500">{tCommon('loading')}</Div>}
            />
        );
    }

    return (
        <LayoutWrapper
            title={quote.number}
            subTitle={quote.customer?.name ?? t('customer')}
            leftActions={
                <Button
                    id="quote-back"
                    type={EButtonType.tertiary}
                    size={EButtonSize.medium}
                    iconPosition="only"
                    icon={{
                        name: IconComponentsEnum.arrowLeft,
                        size: ESize.sm,
                        color: 'text-gray-600',
                    }}
                    onClick={() => router.push(Routes.Quotes.index)}
                    className="shrink-0"
                />

            }
            rightActions={
                <Div className="flex flex-wrap items-center gap-2">
                    <Badge
                        id={`quote-status-${quote.status}`}
                        text={quoteStatusLabel(quote.status)}
                        type={quoteStatusColor(quote.status)}
                        size={EBadgeSize.small}
                    />
                    {quote.invoice && (
                        <Link href={Routes.Invoices.show(quote.invoice.id)}>
                            <Button
                                id="quote-view-invoice"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text={`${tInvoices('title')} ${quote.invoice.number}`}
                            />
                        </Link>
                    )}
                    {!isLocked && (
                        <Button
                            id="quote-convert"
                            type={EButtonType.primary}
                            size={EButtonSize.small}
                            text={convertMutation.isPending ? tCommon('loading') : t('convert')}
                            disabled={convertMutation.isPending}
                            onClick={() => convertMutation.mutate()}
                        />
                    )}
                </Div>
            }
            mainSection={
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="mx-auto flex max-w-3xl flex-col gap-6"
                >
                    {!isLocked && (
                        <Div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                            <Label variant={EVariantLabel.bodySmall} color="text-primary-800">
                                {t('convertHint')}
                            </Label>
                        </Div>
                    )}
                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <Div className="mb-4 flex flex-wrap justify-between gap-2">
                            <Div>
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('total')}</Label>
                                <Label variant={EVariantLabel.bodyLarge} color="text-primary-600">
                                    {formatMoney(quote.total)}
                                </Label>
                            </Div>
                        </Div>
                        <Div className="flex flex-col gap-4">
                            <Dropdown
                                label={t('customer')}
                                required
                                options={customerOptions}
                                value={customerId}
                                onChange={(value) => {
                                    if (typeof value === 'string') setCustomerId(value);
                                }}
                                disabled={isLocked}
                                placeholder={t('customer')}
                                searchable
                            />
                            <Dropdown
                                label={tCommon('status')}
                                options={statusOptions}
                                value={status}
                                onChange={(value) => {
                                    if (isEditableQuoteStatus(value)) setStatus(value);
                                }}
                                disabled={isLocked}
                                placeholder={tCommon('status')}
                            />
                            <Input
                                id="quote-valid-until"
                                label={t('validUntil')}
                                type={EInputType.date}
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                disabled={isLocked}
                            />
                            <Input
                                id="quote-notes"
                                label={tCommon('notes')}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isLocked}
                            />
                        </Div>
                    </Div>

                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <DocumentLinesEditor lines={lines} onChange={setLines} disabled={isLocked} />
                    </Div>

                    {!isLocked && (
                        <Div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Button
                                id="quote-save"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={updateMutation.isPending ? tCommon('loading') : tCommon('save')}
                                disabled={updateMutation.isPending}
                                onClick={() => void handleSubmit()}
                            />
                        </Div>
                    )}
                </form>
            }
        />
    );
}

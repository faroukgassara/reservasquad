'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import {
    fetchInvoice,
    formatMoney,
    markInvoicePaid,
    type InvoiceStatus,
} from '@/lib/sales-api';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import Badge from '@/components/Primitives/Badge/Badge';

function invoiceStatusColor(status: InvoiceStatus): EBadgeType {
    switch (status) {
        case 'PAID':
            return EBadgeType.success;
        case 'POSTED':
            return EBadgeType.primary;
        case 'CANCELLED':
            return EBadgeType.error;
        default:
            return EBadgeType.warning;
    }
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR');
}

export default function InvoiceDetailPage() {
    const t = useTranslations('sales.invoices');
    const tLines = useTranslations('sales.lines');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const invoiceStatusLabel = (status: InvoiceStatus): string => {
        const map: Record<InvoiceStatus, string> = {
            DRAFT: tStatus('draft'),
            POSTED: tStatus('validated'),
            PAID: tStatus('paid'),
            CANCELLED: tStatus('cancelled'),
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

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Dashboard);
    }, [isAdmin, router]);

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => fetchInvoice(id),
        enabled: isAdmin && !!id,
    });

    const markPaidMutation = useMutation({
        mutationFn: () => markInvoicePaid(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), t('markPaid'), { type: EToastType.SUCCESS });
        },
        onError: (e: Error) => openToast(tCommon('error'), e.message, { type: EToastType.ERROR }),
    });

    if (!isAdmin) return null;

    if (isLoading || !invoice) {
        return (
            <LayoutWrapper
                title={t('title')}
                subTitle={tCommon('loading')}
                mainSection={<Div className="p-8 text-center text-gray-500">{tCommon('loading')}</Div>}
            />
        );
    }

    const canMarkPaid = invoice.status === 'POSTED' || invoice.status === 'DRAFT';

    return (
        <LayoutWrapper
            title={invoice.number}
            subTitle={invoice.customer?.name ?? t('customer')}
            leftActions={
                <Button
                    id="invoice-back"
                    type={EButtonType.tertiary}
                    size={EButtonSize.medium}
                    iconPosition="only"
                    icon={{
                        name: IconComponentsEnum.arrowLeft,
                        size: ESize.sm,
                        color: 'text-gray-600',
                    }}
                    onClick={() => router.push(Routes.Invoices.index)}
                />
            }
            rightActions={
                <Div className="flex flex-wrap items-center gap-2">
                    <Badge
                        id={`invoice-status-${invoice.status}`}
                        text={invoiceStatusLabel(invoice.status)}
                        type={invoiceStatusColor(invoice.status)}
                        size={EBadgeSize.small}
                    />
                    {canMarkPaid && (
                        <Button
                            id="invoice-mark-paid"
                            type={EButtonType.primary}
                            size={EButtonSize.small}
                            text={markPaidMutation.isPending ? tCommon('loading') : t('markPaid')}
                            disabled={markPaidMutation.isPending}
                            onClick={() => markPaidMutation.mutate()}
                        />
                    )}
                </Div>
            }
            mainSection={
                <Div className="mx-auto flex max-w-3xl flex-col gap-6">
                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <Div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Div>
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('customer')}</Label>
                                <Label variant={EVariantLabel.body} color="text-gray-900">{invoice.customer?.name ?? '—'}</Label>
                                {invoice.customer?.company && (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                        {invoice.customer.company}
                                    </Label>
                                )}
                            </Div>
                            <Div>
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('sourceQuote')}</Label>
                                {invoice.quote ? (
                                    <Link href={Routes.Quotes.show(invoice.quote.id)} className="text-primary-600 hover:underline">
                                        <Label variant={EVariantLabel.body} color="text-primary-600">
                                            {invoice.quote.number}
                                        </Label>
                                    </Link>
                                ) : (
                                    <Label variant={EVariantLabel.body} color="text-gray-900">—</Label>
                                )}
                            </Div>
                            <Div>
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('issueDate')}</Label>
                                <Label variant={EVariantLabel.body} color="text-gray-900">{formatDate(invoice.issueDate)}</Label>
                            </Div>
                            <Div>
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('dueDate')}</Label>
                                <Label variant={EVariantLabel.body} color="text-gray-900">{formatDate(invoice.dueDate)}</Label>
                            </Div>
                        </Div>
                        {invoice.notes && (
                            <Div className="mt-4 border-t border-gray-100 pt-4">
                                <Label variant={EVariantLabel.hint} color="text-gray-500">{t('notes')}</Label>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700">{invoice.notes}</Label>
                            </Div>
                        )}
                    </Div>

                    <Div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                        <Label variant={EVariantLabel.h6} color="text-gray-900" className="mb-4">
                            {t('lines')}
                        </Label>
                        <Div className="overflow-x-auto">
                            <table className="w-full min-w-lg text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-600">
                                        <th className="pb-2 pr-4 font-medium">{tLines('label')}</th>
                                        <th className="pb-2 pr-4 font-medium">{tLines('quantity')}</th>
                                        <th className="pb-2 pr-4 font-medium">{tLines('unitPrice')}</th>
                                        <th className="pb-2 pr-4 font-medium">{tLines('taxRate')}</th>
                                        <th className="pb-2 text-right font-medium">{tLines('lineTotal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.lines ?? []).map((line) => (
                                        <tr key={line.id} className="border-b border-gray-100">
                                            <td className="py-3 pr-4">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{line.label}</Label>
                                                {line.description && (
                                                    <Label variant={EVariantLabel.hint} color="text-gray-500">{line.description}</Label>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{line.quantity}</Label>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(line.unitPrice)}</Label>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{line.taxRate}%</Label>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(line.lineTotal)}</Label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Div>

                        <Div className="mt-4 flex flex-col gap-1 border-t border-gray-100 pt-4 sm:ml-auto sm:max-w-xs">
                            <Div className="flex justify-between gap-4">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600">{tLines('subtotal')}</Label>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(invoice.subtotal)}</Label>
                            </Div>
                            <Div className="flex justify-between gap-4">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600">{tLines('tax')}</Label>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(invoice.taxTotal)}</Label>
                            </Div>
                            <Div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                                <Label variant={EVariantLabel.bodyLarge} color="text-gray-900">{tLines('total')}</Label>
                                <Label variant={EVariantLabel.bodyLarge} color="text-primary-600">{formatMoney(invoice.total)}</Label>
                            </Div>
                        </Div>
                    </Div>
                </Div>
            }
        />
    );
}

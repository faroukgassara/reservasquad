'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import OrganismPosReceipt from '@/components/Organisms/Pos/OrganismPosReceipt';
import { useToast } from '@/contexts/ToastContext';
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
import { formatMoney } from '@/lib/daily-income-api';
import { documentLineName } from '@/lib/pos-documents';
import {
    fetchPosOrder,
    formatOrderNumber,
    formatPosDateTime,
    personName,
    refundPosOrder,
    round3,
    toAmount,
    type PosOrderDetail,
} from '@/lib/pos-api';
import { printPosReceipt } from '@/lib/pos-print';

interface IOrganismPosOrderDetail {
    orderId: string;
    canRefund: boolean;
    onOpenOrder?: (orderId: string) => void;
}

type RefundMethod = 'CASH' | 'BANK';

export default function OrganismPosOrderDetail({ orderId, canRefund, onOpenOrder }: Readonly<IOrganismPosOrderDetail>) {
    const t = useTranslations('pos.orders');
    const tMethod = useTranslations('pos.methods');
    const tCommon = useTranslations('common');
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [refunding, setRefunding] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [method, setMethod] = useState<RefundMethod>('CASH');

    const { data: order, isLoading } = useQuery({
        queryKey: ['pos-order', orderId],
        queryFn: () => fetchPosOrder(orderId),
    });

    const refundMutation = useMutation({
        mutationFn: (body: Parameters<typeof refundPosOrder>[1]) => refundPosOrder(orderId, body),
        onSuccess: (refund: PosOrderDetail) => {
            void queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-order'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-session-summary'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-products-available'] });
            openToast(tCommon('success'), t('refundDone', { number: formatOrderNumber(refund.number) }), {
                type: EToastType.SUCCESS,
            });
            setRefunding(false);
            setQuantities({});
            onOpenOrder?.(refund.id);
        },
        onError: (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    if (isLoading || !order) {
        return (
            <Div className="flex justify-center py-12">
                <Spinner size={ESize.lg} color="text-primary-500" />
            </Div>
        );
    }

    const refundableLines = order.lines.filter((l) => l.refundableQuantity > 0);
    const isRefundable = canRefund && order.status === 'PAID' && refundableLines.length > 0;

    const refundLines = refundableLines
        .map((line) => ({
            lineId: line.id,
            quantity: round3(Math.min(line.refundableQuantity, Number((quantities[line.id] ?? '').replace(',', '.')) || 0)),
            line,
        }))
        .filter((l) => l.quantity > 0);
    const refundTotal = round3(
        refundLines.reduce(
            (sum, { quantity, line }) =>
                sum + quantity * toAmount(line.unitPrice) * (1 - toAmount(line.discountPct) / 100),
            0,
        ),
    );

    return (
        <Div className="space-y-4">
            <Div className="flex items-start justify-between gap-3">
                <Div className="flex flex-col">
                    <Label variant={EVariantLabel.h6} color="text-gray-900">
                        {t('orderNumber', { number: formatOrderNumber(order.number) })}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {`${formatPosDateTime(order.createdAt)} · ${personName(order.cashier)}`}
                    </Label>
                    {order.creditClient ? (
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {t('clientValue', { name: personName(order.creditClient) })}
                        </Label>
                    ) : null}
                </Div>
                <Badge
                    id={`pos-order-status-${order.id}`}
                    text={order.status === 'REFUND' ? t('statusRefund') : t('statusPaid')}
                    type={order.status === 'REFUND' ? EBadgeType.warning : EBadgeType.success}
                    size={EBadgeSize.small}
                />
            </Div>

            {order.refundOf ? (
                <button
                    type="button"
                    onClick={() => onOpenOrder?.(order.refundOf!.id)}
                    className="text-left"
                >
                    <Label variant={EVariantLabel.caption} color="text-primary-600" className="underline">
                        {t('refundOf', { number: formatOrderNumber(order.refundOf.number) })}
                    </Label>
                </button>
            ) : null}

            <Div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {order.lines.map((line) => (
                    <Div key={line.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <Div className="flex min-w-0 flex-col">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                {documentLineName(line, t)}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-500" className="tabular-nums">
                                {t('lineDetail', {
                                    quantity: toAmount(line.quantity),
                                    price: formatMoney(toAmount(line.unitPrice)),
                                })}
                                {toAmount(line.discountPct) > 0
                                    ? ` · ${t('discount', { value: toAmount(line.discountPct) })}`
                                    : ''}
                                {line.refundedQuantity > 0 ? ` · ${t('refunded', { count: line.refundedQuantity })}` : ''}
                            </Label>
                        </Div>
                        {refunding && line.refundableQuantity > 0 ? (
                            <Input
                                id={`pos-refund-qty-${line.id}`}
                                value={quantities[line.id] ?? ''}
                                type={EInputType.number}
                                placeholder={`≤ ${line.refundableQuantity}`}
                                onChange={(e) => setQuantities((prev) => ({ ...prev, [line.id]: e.target.value }))}
                                containerClassName="w-24 shrink-0"
                            />
                        ) : (
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="shrink-0 tabular-nums">
                                {formatMoney(toAmount(line.total))}
                            </Label>
                        )}
                    </Div>
                ))}
            </Div>

            <Div className="space-y-1 rounded-xl bg-gray-50 px-3 py-2">
                <Div className="flex justify-between gap-3">
                    <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                        {t('total')}
                    </Label>
                    <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                        {formatMoney(toAmount(order.total))}
                    </Label>
                </Div>
                {order.payments.map((payment) => (
                    <Div key={payment.id} className="flex justify-between gap-3">
                        <Label variant={EVariantLabel.caption} color="text-gray-600">
                            {tMethod(payment.method)}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                            {formatMoney(toAmount(payment.amount))}
                        </Label>
                    </Div>
                ))}
                {toAmount(order.change) > 0 ? (
                    <Div className="flex justify-between gap-3">
                        <Label variant={EVariantLabel.caption} color="text-gray-600">
                            {t('change')}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                            {formatMoney(toAmount(order.change))}
                        </Label>
                    </Div>
                ) : null}
            </Div>

            {order.refunds.length > 0 ? (
                <Div className="space-y-1">
                    <Label variant={EVariantLabel.overline} color="text-gray-500">
                        {t('refunds')}
                    </Label>
                    {order.refunds.map((refund) => (
                        <button
                            key={refund.id}
                            type="button"
                            onClick={() => onOpenOrder?.(refund.id)}
                            className="flex w-full justify-between gap-3 rounded-lg px-2 py-1 text-left hover:bg-gray-50"
                        >
                            <Label variant={EVariantLabel.caption} color="text-primary-600">
                                {t('orderNumber', { number: formatOrderNumber(refund.number) })}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="tabular-nums">
                                {formatMoney(toAmount(refund.total))}
                            </Label>
                        </button>
                    ))}
                </Div>
            ) : null}

            {order.note ? (
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="block italic">
                    {order.note}
                </Label>
            ) : null}

            {refunding ? (
                <Div className="space-y-3 rounded-xl border border-warning-200 bg-warning-50 p-3">
                    <Tabs
                        variant="pills"
                        options={[
                            { value: 'CASH', label: tMethod('CASH') },
                            { value: 'BANK', label: tMethod('BANK') },
                        ]}
                        value={method}
                        onChange={(value) => setMethod(value as RefundMethod)}
                        className="w-full"
                    />
                    <Div className="flex justify-between gap-3">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                            {t('refundAmount')}
                        </Label>
                        <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                            {formatMoney(refundTotal)}
                        </Label>
                    </Div>
                    <Div className="flex flex-wrap gap-2">
                        <Button
                            id="pos-refund-cancel"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            text={tCommon('cancel')}
                            onClick={() => {
                                setRefunding(false);
                                setQuantities({});
                            }}
                            className="flex-1"
                        />
                        <Button
                            id="pos-refund-submit"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={t('confirmRefund')}
                            disabled={refundLines.length === 0}
                            isLoading={refundMutation.isPending}
                            onClick={() =>
                                refundMutation.mutate({
                                    method,
                                    lines: refundLines.map(({ lineId, quantity }) => ({ lineId, quantity })),
                                })
                            }
                            className="flex-1"
                        />
                    </Div>
                </Div>
            ) : (
                <Div className="flex flex-wrap gap-2">
                    <Button
                        id="pos-order-print"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.printer, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('printTicket')}
                        onClick={() => printPosReceipt(receiptRef.current?.firstElementChild as HTMLElement | null)}
                        className="flex-1"
                    />
                    {isRefundable ? (
                        <Button
                            id="pos-order-refund"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.rotate, size: ESize.sm, color: 'text-warning-600' }}
                            text={t('refund')}
                            onClick={() => {
                                setRefunding(true);
                                setQuantities(
                                    Object.fromEntries(refundableLines.map((l) => [l.id, String(l.refundableQuantity)])),
                                );
                            }}
                            className="flex-1"
                        />
                    ) : null}
                </Div>
            )}

            {!canRefund && order.status === 'PAID' && refundableLines.length > 0 ? (
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                    {t('refundNeedsSession')}
                </Label>
            ) : null}

            <div ref={receiptRef} className="hidden">
                <OrganismPosReceipt order={order} />
            </div>
        </Div>
    );
}

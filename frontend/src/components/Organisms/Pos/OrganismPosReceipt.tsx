'use client';

import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { documentLineName } from '@/lib/pos-documents';
import {
    formatOrderNumber,
    formatPosDateTime,
    personName,
    toAmount,
    type PosOrderDetail,
} from '@/lib/pos-api';

interface IOrganismPosReceipt {
    order: PosOrderDetail;
    className?: string;
}

/** 80mm ticket; `printPosReceipt()` prints only the element marked with `pos-print-area`. */
export default function OrganismPosReceipt({ order, className }: Readonly<IOrganismPosReceipt>) {
    const t = useTranslations('pos.receipt');
    const tMethod = useTranslations('pos.methods');
    const isRefund = order.status === 'REFUND';

    return (
        <Div
            className={twMerge(
                'pos-receipt mx-auto w-full max-w-80 space-y-3 rounded-lg border border-gray-200 bg-white p-4',
                className,
            )}
        >
            <Div className="flex flex-col items-center text-center">
                <Label variant={EVariantLabel.h5} color="text-gray-900">
                    {t('brand')}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-600">
                    {isRefund ? t('refundTitle') : t('title')}
                </Label>
            </Div>

            <Div className="space-y-0.5 border-y border-dashed border-gray-300 py-2">
                <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                    {t('order', { number: formatOrderNumber(order.number) })}
                </Label>
                {order.refundOf ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                        {t('refundOf', { number: formatOrderNumber(order.refundOf.number) })}
                    </Label>
                ) : null}
                <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                    {formatPosDateTime(order.createdAt)}
                </Label>
                <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                    {t('cashier', { name: personName(order.cashier) })}
                </Label>
                {order.creditClient ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-700" className="block">
                        {t('client', { name: personName(order.creditClient) })}
                    </Label>
                ) : null}
            </Div>

            <Div className="space-y-1.5">
                {order.lines.map((line) => (
                    <Div key={line.id}>
                        <Div className="flex justify-between gap-2">
                            <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-medium">
                                {documentLineName(line, t)}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-900" className="shrink-0 tabular-nums">
                                {formatMoney(toAmount(line.total))}
                            </Label>
                        </Div>
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block tabular-nums">
                            {t('lineDetail', {
                                quantity: toAmount(line.quantity),
                                price: formatMoney(toAmount(line.unitPrice)),
                            })}
                            {toAmount(line.discountPct) > 0
                                ? ` · ${t('discount', { value: toAmount(line.discountPct) })}`
                                : ''}
                        </Label>
                    </Div>
                ))}
            </Div>

            <Div className="space-y-1 border-t border-dashed border-gray-300 pt-2">
                <Div className="flex justify-between gap-2">
                    <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                        {t('total')}
                    </Label>
                    <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                        {formatMoney(toAmount(order.total))}
                    </Label>
                </Div>
                {order.payments.map((payment) => (
                    <Div key={payment.id} className="flex justify-between gap-2">
                        <Label variant={EVariantLabel.caption} color="text-gray-700">
                            {tMethod(payment.method)}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-700" className="tabular-nums">
                            {formatMoney(toAmount(payment.amount))}
                        </Label>
                    </Div>
                ))}
                {toAmount(order.change) > 0 ? (
                    <Div className="flex justify-between gap-2">
                        <Label variant={EVariantLabel.caption} color="text-gray-700">
                            {t('change')}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-700" className="tabular-nums">
                            {formatMoney(toAmount(order.change))}
                        </Label>
                    </Div>
                ) : null}
            </Div>

            {order.note ? (
                <Label variant={EVariantLabel.caption} color="text-gray-600" className="block italic">
                    {order.note}
                </Label>
            ) : null}

            <Label variant={EVariantLabel.caption} color="text-gray-500" className="block text-center">
                {t('thanks')}
            </Label>
        </Div>
    );
}

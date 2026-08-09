'use client';

import { useLocale, useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Badge from '@/components/Primitives/Badge/Badge';
import Icon from '@/components/Primitives/Icon/Icon';
import Button from '@/components/Primitives/Button/Button';
import {
    EBadgeSize,
    EBadgeType,
    EButtonType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { useCurrentModal } from '@/contexts/ModalContext';
import { formatProductMoney } from '@/lib/product-api';
import type { OrderRecord, OrderStatus } from '@/lib/order-api';

function statusBadgeType(status: OrderStatus): EBadgeType {
    if (status === 'CONFIRMED') return EBadgeType.success;
    if (status === 'CANCELLED') return EBadgeType.error;
    return EBadgeType.warning;
}

type OrderDetailModalProps = Readonly<{
    order: OrderRecord;
    statusLabel: (status: OrderStatus) => string;
}>;

export default function OrderDetailModal({ order, statusLabel }: OrderDetailModalProps) {
    const t = useTranslations('admin.orders');
    const tCheckout = useTranslations('checkout');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const { closeModal } = useCurrentModal();

    const formattedDate = order.createdAt
        ? new Date(order.createdAt).toLocaleString(locale, {
              dateStyle: 'long',
              timeStyle: 'short',
          })
        : '—';

    return (
        <Modal>
            <Div className="flex w-full max-w-2xl flex-col gap-6 p-6">
                {/* Header */}
                <Div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <Div className="flex items-center gap-3">
                        <Div className="flex size-10 items-center justify-center rounded-xl bg-primary-50">
                            <Icon
                                name={IconComponentsEnum.shoppingCart}
                                size={ESize.md}
                                color="text-primary-500"
                            />
                        </Div>
                        <Div>
                            <Label variant={EVariantLabel.h6} color="text-gray-900">
                                {order.number}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-400" className="block">
                                {formattedDate}
                            </Label>
                        </Div>
                    </Div>
                    <Badge
                        id={`order-detail-status-${order.id}`}
                        text={statusLabel(order.status)}
                        type={statusBadgeType(order.status)}
                        size={EBadgeSize.small}
                    />
                </Div>

                {/* Customer & Delivery info */}
                <Div className="grid gap-4 sm:grid-cols-2">
                    <Div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-25 p-4">
                        <Div className="flex items-center gap-2">
                            <Icon name={IconComponentsEnum.user} size={ESize.sm} color="text-gray-400" />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-400">
                                {t('customer')}
                            </Label>
                        </Div>
                        <Label variant={EVariantLabel.body} color="text-gray-900">
                            {order.firstName} {order.lastName}
                        </Label>
                        <Div className="flex flex-col gap-0.5">
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {order.email}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {order.phone}
                            </Label>
                        </Div>
                    </Div>

                    <Div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-25 p-4">
                        <Div className="flex items-center gap-2">
                            <Icon name={IconComponentsEnum.truck} size={ESize.sm} color="text-gray-400" />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-400">
                                {tCheckout('deliveryTitle')}
                            </Label>
                        </Div>
                        <Label variant={EVariantLabel.body} color="text-gray-900">
                            {order.city}, {order.governorate}
                        </Label>
                        <Div className="flex flex-col gap-0.5">
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {order.address}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {order.postalCode}
                            </Label>
                            <Label variant={EVariantLabel.caption} color="text-primary-500">
                                {tCheckout(`shippingMethods.${order.shippingMethod}.label`)} —{' '}
                                {order.shippingFee === 0
                                    ? tCheckout('shippingFree')
                                    : formatProductMoney(order.shippingFee, locale)}
                            </Label>
                        </Div>
                    </Div>
                </Div>

                {/* Line items */}
                <Div className="flex flex-col gap-2">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-400" className="px-1">
                        {t('items')} ({(order.lines ?? []).length})
                    </Label>
                    <Div className="flex flex-col gap-2 rounded-xl border border-gray-100 p-2">
                        {(order.lines ?? []).map((line, idx) => (
                            <Div
                                key={line.id}
                                className={`flex items-center gap-3 rounded-lg p-2 ${
                                    idx % 2 === 0 ? 'bg-gray-25' : 'bg-white'
                                }`}
                            >
                                {line.imageUrl ? (
                                    <img
                                        src={line.imageUrl}
                                        alt={line.productTitle}
                                        className="size-12 shrink-0 rounded-lg border border-gray-100 object-cover"
                                    />
                                ) : (
                                    <Div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                        <Icon
                                            name={IconComponentsEnum.image}
                                            size={ESize.sm}
                                            color="text-gray-300"
                                        />
                                    </Div>
                                )}
                                <Div className="flex min-w-0 flex-1 flex-col">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                        {line.productTitle}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-400" className="block">
                                        {line.material ?? ''}
                                        {line.size ? ` · ${line.size}` : ''}
                                        {line.engraving ? ` · ${line.engraving}` : ''}
                                    </Label>
                                </Div>
                                <Div className="flex shrink-0 flex-col items-end">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                        {formatProductMoney(line.lineTotal, locale)}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-400">
                                        ×{line.quantity} · {formatProductMoney(line.unitPrice, locale)}
                                    </Label>
                                </Div>
                            </Div>
                        ))}
                    </Div>
                </Div>

                {/* Totals */}
                <Div className="rounded-xl bg-gray-25 px-4 py-3">
                    <Div className="flex justify-between py-1">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {tCheckout('subtotal')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                            {formatProductMoney(order.subtotal, locale)}
                        </Label>
                    </Div>
                    <Div className="flex justify-between py-1">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {tCheckout('shipping')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                            {order.shippingFee === 0
                                ? tCheckout('shippingFree')
                                : formatProductMoney(order.shippingFee, locale)}
                        </Label>
                    </Div>
                    <Div className="mt-1 flex justify-between border-t border-gray-200 pt-2">
                        <Label variant={EVariantLabel.body} color="text-gray-900">
                            {tCheckout('total')}
                        </Label>
                        <Label variant={EVariantLabel.h6} color="text-primary-500">
                            {formatProductMoney(order.total, locale)}
                        </Label>
                    </Div>
                </Div>

                {/* Close button */}
                <Div className="flex justify-end">
                    <Button
                        id="order-detail-close"
                        type={EButtonType.secondary}
                        text={tCommon('close')}
                        onClick={closeModal}
                    />
                </Div>
            </Div>
        </Modal>
    );
}

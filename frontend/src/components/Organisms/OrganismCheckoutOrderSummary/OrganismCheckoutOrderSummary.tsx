'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import type { CartLine } from '@/contexts/CartContext';
import { formatProductMoney, getProductImageUrl } from '@/lib/product-api';

type OrganismCheckoutOrderSummaryProps = Readonly<{
    items: CartLine[];
    subtotal: number;
    shippingFee: number;
}>;

export default function OrganismCheckoutOrderSummary({
    items,
    subtotal,
    shippingFee,
}: OrganismCheckoutOrderSummaryProps) {
    const t = useTranslations('checkout');
    const locale = useLocale();
    const total = subtotal + shippingFee;

    return (
        <aside className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
            <span className="mb-5 block font-(family-name:--font-poppins) text-2xl font-bold text-primary-500">
                {t('yourOrder')}
            </span>

            <Div className="mb-4 space-y-3">
                {items.map((line) => {
                    const imageSrc = getProductImageUrl(line.imageUrl);
                    return (
                        <Div key={line.id} className="flex items-center gap-3">
                            <Div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {imageSrc ? (
                                    <Image
                                        src={imageSrc}
                                        alt={line.title}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                        unoptimized={imageSrc.startsWith('http')}
                                    />
                                ) : null}
                            </Div>
                            <Div className="min-w-0 flex-1">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="line-clamp-1"
                                >
                                    {line.title}
                                </Label>
                                <Label variant={EVariantLabel.caption} color="text-gray-500">
                                    × {line.quantity}
                                </Label>
                            </Div>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                {formatProductMoney(line.unitPrice * line.quantity, locale)}
                            </Label>
                        </Div>
                    );
                })}
            </Div>

            <Div className="space-y-3 border-t border-gray-200 pt-4">
                <Div className="flex items-center justify-between">
                    <Label variant={EVariantLabel.body} color="text-gray-600">
                        {t('subtotal')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-900">
                        {formatProductMoney(subtotal, locale)}
                    </Label>
                </Div>
                <Div className="flex items-center justify-between">
                    <Label variant={EVariantLabel.body} color="text-gray-600">
                        {t('shipping')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-900">
                        {shippingFee === 0
                            ? t('shippingFree')
                            : formatProductMoney(shippingFee, locale)}
                    </Label>
                </Div>
            </Div>

            <Div className="my-4 border-t border-gray-200" />

            <Div className="flex items-center justify-between">
                <Label variant={EVariantLabel.body} color="text-primary-500">
                    {t('total')}
                </Label>
                <Label variant={EVariantLabel.h4} color="text-primary-500">
                    {formatProductMoney(total, locale)}
                </Label>
            </Div>
        </aside>
    );
}

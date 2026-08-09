'use client';

import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import CartLineCard from '@/components/Primitives/CartLineCard/CartLineCard';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { ESTIMATED_SHIPPING_TND, useCart } from '@/contexts/CartContext';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { formatProductMoney } from '@/lib/product-api';
import { useLocale, useTranslations } from 'next-intl';

export default function TemplateCart() {
    const t = useTranslations('cart');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const { items, subtotal } = useCart();
    const isEmpty = items.length === 0;
    const total = subtotal + (isEmpty ? 0 : ESTIMATED_SHIPPING_TND);

    return (
        <section dir={isRtl ? 'rtl' : 'ltr'} className="bg-gray-25 pb-16 pt-8 sm:pt-10">
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Label variant={EVariantLabel.h1} color="text-primary-500" className="mb-8 block">
                            {t('title')}
                        </Label>

                        {isEmpty ? (
                            <Div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                                <Div className="mb-6 flex size-24 items-center justify-center rounded-full bg-gray-100">
                                    <Icon
                                        name={IconComponentsEnum.shoppingCart}
                                        size={ESize.xl}
                                        color="text-primary-500"
                                    />
                                </Div>
                                <span className="mb-3 block font-(family-name:--font-playfair) text-2xl font-bold text-primary-500">
                                    {t('emptyTitle')}
                                </span>
                        <Label
                            variant={EVariantLabel.body}
                            color="text-primary-400"
                            className="mb-8 block max-w-md"
                        >
                            {t('emptyBody')}
                        </Label>
                        <Link
                            href={Routes.Shop.index}
                            className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                        >
                            {t('exploreShop')}
                        </Link>
                    </Div>
                ) : (
                    <Div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                        <Div className="space-y-4">
                            {items.map((line) => (
                                <CartLineCard key={line.id} line={line} />
                            ))}
                        </Div>

                        <aside className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
                            <span className="mb-5 block font-(family-name:--font-playfair) text-2xl font-bold text-primary-500">
                                {t('summary')}
                            </span>

                            <Div className="space-y-3">
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
                                        {t('estimatedShipping')}
                                    </Label>
                                    <Label variant={EVariantLabel.body} color="text-gray-900">
                                        {formatProductMoney(ESTIMATED_SHIPPING_TND, locale)}
                                    </Label>
                                </Div>
                            </Div>

                            <Div className="my-4 border-t border-gray-200" />

                            <Div className="mb-6 flex items-center justify-between">
                                <Label variant={EVariantLabel.body} color="text-primary-500">
                                    {t('total')}
                                </Label>
                                <Label variant={EVariantLabel.h4} color="text-primary-500">
                                    {formatProductMoney(total, locale)}
                                </Label>
                            </Div>

                            <Link
                                href={Routes.Checkout}
                                className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                            >
                                {t('checkout')}
                                <Icon
                                    name={IconComponentsEnum.arrowRight}
                                    size={ESize.sm}
                                    color="text-white"
                                    className={isRtl ? 'rotate-180' : undefined}
                                />
                            </Link>

                            <Link
                                href={Routes.Shop.index}
                                className="mx-auto block text-center text-sm font-medium text-gray-600 underline-offset-2 transition-colors hover:text-primary-500 hover:underline"
                            >
                                {t('continueShopping')}
                            </Link>
                        </aside>
                    </Div>
                )}
            </Div>
        </section>
    );
}

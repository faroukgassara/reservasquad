'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import CartLineCard from '@/components/Primitives/CartLineCard/CartLineCard';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useCart } from '@/contexts/CartContext';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { formatProductMoney } from '@/lib/product-api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useLocale, useTranslations } from 'next-intl';

export default function OrganismCartDrawer() {
    const t = useTranslations('cart');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const { items, itemCount, subtotal, isDrawerOpen, closeDrawer } = useCart();
    const isEmpty = items.length === 0;

    useBodyScrollLock(isDrawerOpen);

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <motion.div
                    className="fixed inset-0 z-9999 flex items-stretch justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <button
                        type="button"
                        aria-label={t('close')}
                        className="absolute inset-0 bg-black/40"
                        onClick={closeDrawer}
                    />
                    <motion.aside
                        dir={isRtl ? 'rtl' : 'ltr'}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('title')}
                        className="relative flex h-dvh w-full max-w-md flex-col bg-gray-25 shadow-xl"
                        initial={{ x: isRtl ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isRtl ? '-100%' : '100%' }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        <Div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
                            <Div className="flex items-center gap-2.5">
                                <Icon
                                    name={IconComponentsEnum.shoppingCart}
                                    size={ESize.md}
                                    color="text-primary-500"
                                />
                                <span className="font-(family-name:--font-poppins) text-xl font-bold text-primary-500">
                                    {isEmpty ? t('title') : t('titleWithCount', { count: itemCount })}
                                </span>
                            </Div>
                            <Icon
                                name={IconComponentsEnum.close}
                                size={ESize.md}
                                color="text-gray-700"
                                className="cursor-pointer transition-colors hover:text-primary-500"
                                handleClick={closeDrawer}
                            />
                        </Div>

                        {isEmpty ? (
                            <Div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                                <Div className="mb-6 flex size-24 items-center justify-center rounded-full bg-gray-100">
                                    <Icon
                                        name={IconComponentsEnum.shoppingCart}
                                        size={ESize.xl}
                                        color="text-primary-500"
                                    />
                                </Div>
                                <span className="mb-3 block font-(family-name:--font-poppins) text-2xl font-bold text-primary-500">
                                    {t('emptyTitle')}
                                </span>
                                <Label
                                    variant={EVariantLabel.body}
                                    color="text-primary-400"
                                    className="mb-8 block max-w-xs"
                                >
                                    {t('emptyBody')}
                                </Label>
                                <Link
                                    href={Routes.Shop.index}
                                    onClick={closeDrawer}
                                    className="inline-flex h-12 items-center justify-center rounded-full bg-accent-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
                                >
                                    {t('exploreShop')}
                                </Link>
                            </Div>
                        ) : (
                            <>
                                <Div
                                    className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
                                    data-scroll-lock-scrollable
                                >
                                    {items.map((line) => (
                                        <CartLineCard key={line.id} line={line} compact />
                                    ))}
                                </Div>

                                <Div className="shrink-0 border-t border-gray-200 bg-gray-25 px-5 py-4">
                                    <Div className="mb-1 flex items-center justify-between">
                                        <Label variant={EVariantLabel.body} color="text-gray-700">
                                            {t('subtotal')}
                                        </Label>
                                        <Label variant={EVariantLabel.body} color="text-primary-500">
                                            {formatProductMoney(subtotal, locale)}
                                        </Label>
                                    </Div>
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-gray-500"
                                        className="mb-4 block"
                                    >
                                        {t('shippingNote')}
                                    </Label>
                                    <Link
                                        href={Routes.Checkout}
                                        onClick={closeDrawer}
                                        className="mb-2.5 flex h-12 w-full items-center justify-center rounded-xl bg-accent-500 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
                                    >
                                        {t('checkout')}
                                    </Link>
                                    <Link
                                        href={Routes.Cart}
                                        onClick={closeDrawer}
                                        className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-accent-500 bg-white text-sm font-semibold text-primary-500 transition-colors hover:bg-accent-50"
                                    >
                                        {t('viewCart')}
                                    </Link>
                                </Div>
                            </>
                        )}
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

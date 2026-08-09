'use client';

import { useQuery } from '@tanstack/react-query';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { useCart } from '@/contexts/CartContext';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import {
    fetchPublicFeaturedProducts,
    getProductImageUrl,
    getProductSellPrice,
    type ProductRecord,
} from '@/lib/product-api';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { formatProductMoney } from '@/lib/product-api';

function ProductCard({
    product,
    locale,
    hiddenOnMobile,
}: Readonly<{ product: ProductRecord; locale: string; hiddenOnMobile?: boolean }>) {
    const t = useTranslations('home.products');
    const { addItem } = useCart();
    const imageSrc = getProductImageUrl(product.imageUrl);
    const badges = product.badges ?? [];
    const sellPrice = getProductSellPrice(product);

    return (
        <article
            className={twMerge(
                'group flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                hiddenOnMobile && 'hidden lg:flex',
            )}
        >
            <Div className="relative aspect-square min-h-0 overflow-hidden bg-gray-100 sm:aspect-5/4">
                <Link href={Routes.Shop.detail(product.slug)} className="absolute inset-0 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageSrc}
                        alt=""
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>

                {badges.length > 0 && (
                    <Div className="absolute start-2 top-2 z-10 flex flex-col gap-1">
                        {badges.map((badge) => (
                            <span
                                key={badge}
                                className="rounded-md bg-gold-400 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-900"
                            >
                                {badge}
                            </span>
                        ))}
                    </Div>
                )}

                <Div
                    className={twMerge(
                        'absolute inset-0 z-10 flex items-center justify-center gap-2 bg-primary-900/45 px-3 opacity-0 transition-opacity duration-200',
                        'group-hover:opacity-100',
                    )}
                >
                    <Link
                        href={Routes.Shop.detail(product.slug)}
                        aria-label={t('quickView')}
                        className="flex size-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        <Icon name={IconComponentsEnum.eye} size={ESize.sm} color="text-gray-900" />
                    </Link>
                    <button
                        type="button"
                        onClick={() =>
                            addItem({
                                productId: product.id,
                                slug: product.slug,
                                title: product.title,
                                imageUrl: product.imageUrl ?? '',
                                unitPrice: sellPrice,
                            })
                        }
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold-400 px-3.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gold-300"
                    >
                        <Icon
                            name={IconComponentsEnum.shoppingCart}
                            size={ESize.sm}
                            color="text-gray-900"
                        />
                        {t('addToCart')}
                    </button>
                </Div>
            </Div>

            <Div className="flex flex-1 flex-col p-3 sm:p-3.5">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="uppercase">
                    {product.category?.name ?? '—'}
                </Label>
                <Link href={Routes.Shop.detail(product.slug)} className="mt-1">
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-900"
                        className="block line-clamp-2"
                    >
                        {product.title}
                    </Label>
                </Link>
                <Div className="mt-auto flex items-baseline gap-2 pt-2">
                    <Label variant={EVariantLabel.body} color="text-gray-900">
                        {formatProductMoney(sellPrice, locale)}
                    </Label>
                    {product.discountedPrice != null && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatProductMoney(product.price, locale)}
                        </span>
                    )}
                </Div>
            </Div>
        </article>
    );
}

export default function TemplateProducts() {
    const t = useTranslations('home.products');
    const locale = useLocale();
    const isRtl = locale === 'ar';

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['public-featured-products'],
        queryFn: () => fetchPublicFeaturedProducts(8),
    });

    let productsContent;
    if (isLoading) {
        productsContent = (
            <Div className="flex flex-1 items-center justify-center">
                <Spinner color="text-primary-500" size={ESize.xl} />
            </Div>
        );
    } else if (products.length === 0) {
        productsContent = (
            <Div className="flex flex-1 items-center justify-center">
                <Label variant={EVariantLabel.body} color="text-gray-500">
                    {t('title')}
                </Label>
            </Div>
        );
    } else {
        productsContent = (
            <Div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 overflow-hidden sm:gap-4 lg:grid-cols-4 lg:gap-5">
                {products.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        hiddenOnMobile={index >= 4}
                    />
                ))}
            </Div>
        );
    }

    return (
        <section
            aria-labelledby="products-heading"
            dir={isRtl ? 'rtl' : 'ltr'}
            className={twMerge(
                'flex flex-col overflow-x-clip bg-gray-50',
                'h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]',
            )}
        >
            <Div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <Div className="mb-4 flex shrink-0 items-end justify-between gap-4 sm:mb-5 lg:mb-6">
                    <Div className="min-w-0">
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-gold-600"
                            className="mb-2 block uppercase"
                        >
                            {t('eyebrow')}
                        </Label>
                        <Div id="products-heading">
                            <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                                {t('title')}
                            </Label>
                        </Div>
                    </Div>

                    <Link
                        href={Routes.Shop.index}
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-900 transition-colors hover:text-primary-600"
                    >
                        {t('viewAll')}
                        <span aria-hidden>{isRtl ? '←' : '→'}</span>
                    </Link>
                </Div>

                {productsContent}
            </Div>
        </section>
    );
}

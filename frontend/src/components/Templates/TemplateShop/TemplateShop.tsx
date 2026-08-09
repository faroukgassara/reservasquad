'use client';

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import {
    fetchPublicProductCategories,
    fetchPublicProducts,
    getProductImageUrl,
    getProductSellPrice,
    type ProductRecord,
} from '@/lib/product-api';
import { useCart } from '@/contexts/CartContext';
import { EInputSize, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { formatProductMoney } from '@/lib/product-api';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';

type SortOption = 'newest' | 'priceAsc' | 'priceDesc';

const SORT_OPTIONS: SortOption[] = ['newest', 'priceAsc', 'priceDesc'];

function isSortOption(value: string | number | (string | number)[]): value is SortOption {
    return typeof value === 'string' && SORT_OPTIONS.includes(value as SortOption);
}
function ProductCard({
    product,
    locale,
}: Readonly<{ product: ProductRecord; locale: string }>) {
    const t = useTranslations('shop');
    const { addItem } = useCart();
    const imageSrc = getProductImageUrl(product.imageUrl);
    const badges = product.badges ?? [];
    const sellPrice = getProductSellPrice(product);

    const handleAddToCart = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            imageUrl: product.imageUrl ?? '',
            unitPrice: sellPrice,
        });
    };

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <Div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                <Link href={Routes.Shop.detail(product.slug)} className="absolute inset-0 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageSrc}
                        alt=""
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>
                {badges.length > 0 && (
                    <Div className="absolute start-2.5 top-2.5 z-10 flex flex-col gap-1">
                        {badges.map((badge) => (
                            <span
                                key={badge}
                                className="rounded-md bg-gold-400 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-gray-900"
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
                        aria-label={product.title}
                        className="flex size-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        <Icon name={IconComponentsEnum.eye} size={ESize.sm} color="text-gray-900" />
                    </Link>
                    <button
                        type="button"
                        onClick={handleAddToCart}
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

            <Div className="flex flex-1 flex-col p-4">
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="uppercase">
                    {product.category?.name ?? '—'}
                </Label>
                <Link href={Routes.Shop.detail(product.slug)} className="mt-1">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block">
                        {product.title}
                    </Label>
                </Link>
                <Div className="mt-auto flex items-baseline gap-2 pt-3">
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

export default function TemplateShop() {
    const t = useTranslations('shop');
    const locale = useLocale();
    const isRtl = locale === 'ar';

    const [categoryId, setCategoryId] = useState('all');
    const [maxPrice, setMaxPrice] = useState(0);
    const [sort, setSort] = useState<SortOption>('newest');
    const [priceInitialized, setPriceInitialized] = useState(false);

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['public-product-categories'],
        queryFn: fetchPublicProductCategories,
    });

    const { data: productsResult, isLoading: productsLoading } = useQuery({
        queryKey: ['public-products', 'shop'],
        queryFn: () =>
            fetchPublicProducts({
                page: 1,
                perPage: 50,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }),
    });

    const products = useMemo(
        () => productsResult?.data ?? [],
        [productsResult?.data],
    );
    const isLoading = categoriesLoading || productsLoading;

    const sortOptions = useMemo(
        () =>
            SORT_OPTIONS.map((value) => ({
                value,
                label: t(`sort.${value}`),
            })),
        [t],
    );

    const catalogMaxPrice = useMemo(
        () => Math.max(0, ...products.map((p) => p.price)),
        [products],
    );

    useEffect(() => {
        if (!priceInitialized && catalogMaxPrice > 0) {
            setMaxPrice(catalogMaxPrice);
            setPriceInitialized(true);
        }
    }, [catalogMaxPrice, priceInitialized]);

    const effectiveMaxPrice = priceInitialized ? maxPrice : catalogMaxPrice;

    const filtered = useMemo(() => {
        let list = products.filter((p) => p.price <= (effectiveMaxPrice || catalogMaxPrice || Infinity));
        if (categoryId !== 'all') {
            list = list.filter((p) => p.categoryId === categoryId);
        }

        const sorted = [...list];
        switch (sort) {
            case 'priceAsc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'priceDesc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                sorted.sort((a, b) => {
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bTime - aTime;
                });
                break;
            default:
        }
        return sorted;
    }, [products, categoryId, effectiveMaxPrice, catalogMaxPrice, sort]);

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-gray-25 pb-14 pt-8 sm:pb-16 sm:pt-10"
            aria-labelledby="shop-heading"
        >
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Div className="mb-8 max-w-3xl sm:mb-10">
                    <Label
                        variant={EVariantLabel.overline}
                        color="text-gold-600"
                        className="mb-2 block uppercase"
                    >
                        {t('eyebrow')}
                    </Label>
                    <Div id="shop-heading">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                            {t('title')}
                        </Label>
                    </Div>
                    <Label variant={EVariantLabel.body} color="text-gray-600" className="mt-3 block">
                        {t('subtitle')}
                    </Label>
                </Div>

                {isLoading ? (
                    <Div className="flex items-center justify-center py-24">
                        <Spinner color="text-primary-500" size={ESize.xl} />
                    </Div>
                ) : (
                    <Div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
                        <aside className="space-y-8">
                            <Div>
                                <Label
                                    variant={EVariantLabel.overline}
                                    color="text-gray-500"
                                    className="mb-3 block uppercase"
                                >
                                    {t('filters.categories')}
                                </Label>
                                <ul className="flex flex-col gap-1">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => setCategoryId('all')}
                                            className={twMerge(
                                                'flex w-full items-center rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors',
                                                categoryId === 'all'
                                                    ? 'bg-primary-500 text-white'
                                                    : 'text-gray-800 hover:bg-gray-100',
                                            )}
                                        >
                                            {t('filters.all')}
                                        </button>
                                    </li>
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <button
                                                type="button"
                                                onClick={() => setCategoryId(cat.id)}
                                                className={twMerge(
                                                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors',
                                                    categoryId === cat.id
                                                        ? 'bg-primary-500 text-white'
                                                        : 'text-gray-800 hover:bg-gray-100',
                                                )}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Div>

                            {catalogMaxPrice > 0 && (
                                <Div>
                                    <Label
                                        variant={EVariantLabel.overline}
                                        color="text-gray-500"
                                        className="mb-3 block uppercase"
                                    >
                                        {t('filters.maxPrice')}
                                    </Label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={catalogMaxPrice}
                                        step={5}
                                        value={effectiveMaxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="w-full accent-primary-500"
                                        aria-label={t('filters.maxPrice')}
                                    />
                                    <Div className="mt-2 flex justify-between text-sm text-gray-600">
                                        <span>{formatProductMoney(0, locale)}</span>
                                        <span>{formatProductMoney(effectiveMaxPrice, locale)}</span>
                                    </Div>
                                </Div>
                            )}
                        </aside>

                        <Div className="min-w-0">
                            <Div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                                    {t('resultCount', { count: filtered.length })}
                                </Label>
                                <Dropdown
                                    options={sortOptions}
                                    value={sort}
                                    onChange={(value) => {
                                        if (isSortOption(value)) setSort(value);
                                    }}
                                    placeholder={t('sort.label')}
                                    size={EInputSize.small}
                                    containerClassName="w-44 sm:w-52"
                                    className="rounded-lg border-gray-200"
                                />
                            </Div>

                            {filtered.length === 0 ? (
                                <Div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center flex flex-col items-center justify-center">
                                    <Label
                                        variant={EVariantLabel.body}
                                        color="text-gray-900"
                                        className="block"
                                    >
                                        {t('emptyTitle')}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-500"
                                        className="mt-2 block"
                                    >
                                        {t('emptyBody')}
                                    </Label>
                                </Div>
                            ) : (
                                <Div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {filtered.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            locale={locale}
                                        />
                                    ))}
                                </Div>
                            )}
                        </Div>
                    </Div>
                )}
            </Div>
        </section>
    );
}

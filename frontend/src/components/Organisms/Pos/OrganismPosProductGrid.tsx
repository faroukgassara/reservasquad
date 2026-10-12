'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import { getMediaUrl } from '@/lib/media-url';
import { toAmount, type PosCategory, type PosProduct } from '@/lib/pos-api';

interface IOrganismPosProductGrid {
    products: PosProduct[];
    categories: PosCategory[];
    isLoading: boolean;
    onAdd: (product: PosProduct) => void;
}

const CATEGORY_THEMES = [
    {
        card: 'border-primary-200/90 bg-gradient-to-br from-primary-50/90 via-primary-50/40 to-white hover:border-primary-400 hover:shadow-primary-500/10 text-primary-950',
        badge: 'bg-primary-500 text-white shadow-primary-500/25',
        icon: IconComponentsEnum.bookOpenText,
    },
    {
        card: 'border-success-200/90 bg-gradient-to-br from-success-50/90 via-success-50/40 to-white hover:border-success-400 hover:shadow-success-500/10 text-success-950',
        badge: 'bg-success-500 text-white shadow-success-500/25',
        icon: IconComponentsEnum.sparkles,
    },
    {
        card: 'border-warning-200/90 bg-gradient-to-br from-warning-50/90 via-warning-50/40 to-white hover:border-warning-400 hover:shadow-warning-500/10 text-warning-950',
        badge: 'bg-warning-500 text-white shadow-warning-500/25',
        icon: IconComponentsEnum.printer,
    },
    {
        card: 'border-accent-200/90 bg-gradient-to-br from-accent-50/90 via-accent-50/40 to-white hover:border-accent-400 hover:shadow-accent-500/10 text-accent-950',
        badge: 'bg-accent-500 text-white shadow-accent-500/25',
        icon: IconComponentsEnum.gift,
    },
    {
        card: 'border-primary-300/80 bg-gradient-to-br from-primary-100/70 via-primary-50/30 to-white hover:border-primary-500 hover:shadow-primary-600/10 text-primary-900',
        badge: 'bg-primary-700 text-white shadow-primary-700/25',
        icon: IconComponentsEnum.penNib,
    },
    {
        card: 'border-success-300/80 bg-gradient-to-br from-success-100/70 via-success-50/30 to-white hover:border-success-500 hover:shadow-success-600/10 text-success-900',
        badge: 'bg-success-700 text-white shadow-success-700/25',
        icon: IconComponentsEnum.layers,
    },
    {
        card: 'border-gray-200/90 bg-gradient-to-br from-gray-100/80 via-gray-50/40 to-white hover:border-gray-400 hover:shadow-gray-500/10 text-gray-900',
        badge: 'bg-gray-700 text-white shadow-gray-700/25',
        icon: IconComponentsEnum.shoppingCart,
    },
];

function TileImage({ imageUrl, alt, fallbackLetter }: Readonly<{ imageUrl: string | null; alt: string; fallbackLetter?: string }>) {
    if (!imageUrl) {
        return (
            <Div className="flex size-full items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-primary-50/30">
                {fallbackLetter ? (
                    <span className="text-xl font-black text-gray-400/80 uppercase">
                        {fallbackLetter}
                    </span>
                ) : (
                    <Icon name={IconComponentsEnum.layers} size={ESize.md} color="text-gray-300" />
                )}
            </Div>
        );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={getMediaUrl(imageUrl)} alt={alt} className="size-full object-cover" />;
}

export default function OrganismPosProductGrid({
    products,
    categories,
    isLoading,
    onAdd,
}: Readonly<IOrganismPosProductGrid>) {
    const t = useTranslations('pos.register');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const activeCategory = categories.find((c) => c.id === categoryId) ?? null;
    const query = search.trim().toLowerCase();

    const visibleProducts = useMemo(
        () =>
            products.filter((p) => {
                if (categoryId && p.categoryId !== categoryId) return false;
                if (!query) return true;
                return [p.name, p.barcode, p.reference].some((v) => v?.toLowerCase().includes(query));
            }),
        [products, categoryId, query],
    );

    const handleSearchEnter = () => {
        if (!query) return;
        const exact = products.find(
            (p) => p.barcode?.toLowerCase() === query || p.reference?.toLowerCase() === query,
        );
        const match = exact ?? (visibleProducts.length === 1 ? visibleProducts[0] : null);
        if (match) {
            onAdd(match);
            setSearch('');
        }
    };

    return (
        <Div className="flex min-h-0 flex-1 flex-col bg-gray-50/40">
            {/* Top Navigation & Search Bar */}
            <Div className="flex items-center gap-2 border-b border-gray-200 bg-white p-3 shadow-2xs sm:gap-3">
                <Div className="flex min-w-0 max-w-[50%] items-center gap-1 sm:max-w-none sm:flex-1">
                    <button
                        type="button"
                        onClick={() => setCategoryId(null)}
                        className={twMerge(
                            'flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-xl transition-all sm:size-auto sm:px-3 sm:py-2 cursor-pointer',
                            !activeCategory
                                ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200 shadow-2xs'
                                : 'text-gray-600 hover:bg-gray-100',
                        )}
                        aria-label={t('home')}
                    >
                        <Icon name={IconComponentsEnum.home} size={ESize.sm} color="text-primary-600" />
                        <span className="hidden text-xs font-bold sm:inline">{t('home')}</span>
                    </button>
                    {activeCategory ? (
                        <>
                            <Icon
                                name={IconComponentsEnum.chevronRight}
                                size={ESize.xs}
                                color="text-gray-400"
                                className="shrink-0 rtl:-scale-x-100"
                            />
                            <div className="flex items-center gap-1.5 rounded-xl bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 border border-primary-200">
                                <span className="truncate">{activeCategory.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setCategoryId(null)}
                                    className="hover:opacity-75 cursor-pointer"
                                >
                                    <Icon name={IconComponentsEnum.close} size={ESize.xs} color="text-primary-700" />
                                </button>
                            </div>
                        </>
                    ) : null}
                </Div>
                <Input
                    id="pos-product-search"
                    leftIcon="search"
                    placeholder={t('searchProducts')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchEnter();
                    }}
                    containerClassName="min-w-0 flex-1 sm:w-72 sm:flex-none"
                />
            </Div>

            {/* Category Cards & Products Grid */}
            <Div className="@container min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
                {!categoryId && !query && categories.length > 0 ? (
                    <Div className="grid grid-cols-2 gap-2.5 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6">
                        {categories.map((category, idx) => {
                            const theme = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setCategoryId(category.id)}
                                    className={twMerge(
                                        'group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 p-2.5 text-start shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] cursor-pointer',
                                        theme.card,
                                    )}
                                >
                                    <Div className="size-11 shrink-0 overflow-hidden rounded-xl shadow-2xs">
                                        {category.imageUrl ? (
                                            <TileImage imageUrl={category.imageUrl} alt={category.name} />
                                        ) : (
                                            <div
                                                className={twMerge(
                                                    'flex size-full items-center justify-center font-bold text-base shadow-inner',
                                                    theme.badge,
                                                )}
                                            >
                                                <Icon name={theme.icon} size={ESize.sm} color="text-white" />
                                            </div>
                                        )}
                                    </Div>
                                    <span className="line-clamp-2 text-xs font-bold leading-snug">
                                        {category.name}
                                    </span>
                                </button>
                            );
                        })}
                    </Div>
                ) : null}

                {isLoading ? (
                    <Div className="flex justify-center py-12">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : null}

                {!isLoading && visibleProducts.length === 0 ? (
                    <Div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <Icon name={IconComponentsEnum.shoppingCart} size={ESize.lg} color="text-gray-300" />
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="font-medium">
                            {t('noProducts')}
                        </Label>
                    </Div>
                ) : null}

                <Div className="grid grid-cols-2 gap-2.5 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6">
                    {visibleProducts.map((product) => {
                        const outOfStock = product.type === 'STOCKABLE' && toAmount(product.stockQty) <= 0;
                        const stockCount = toAmount(product.stockQty);

                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => onAdd(product)}
                                className={twMerge(
                                    'group relative flex flex-col overflow-hidden rounded-2xl border-2 border-gray-200/90 bg-white text-start shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg active:scale-[0.98] cursor-pointer',
                                    outOfStock && 'opacity-85',
                                )}
                            >
                                <Div className="relative aspect-4/3 w-full overflow-hidden bg-gray-50">
                                    <TileImage
                                        imageUrl={product.imageUrl}
                                        alt={product.name}
                                        fallbackLetter={product.name?.charAt(0)}
                                    />
                                    {/* Elevated High-Contrast Price Tag */}
                                    <div className="absolute end-2 top-2 z-10">
                                        <span className="inline-flex items-center rounded-xl bg-white/95 px-2.5 py-1 text-xs sm:text-sm font-black text-gray-900 shadow-md backdrop-blur-md border border-gray-200/90 transition-all duration-200 group-hover:scale-105 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 group-hover:shadow-lg">
                                            <span className="tabular-nums tracking-tight">
                                                {formatMoney(toAmount(product.price))}
                                            </span>
                                        </span>
                                    </div>
                                </Div>
                                <Div className="flex flex-1 flex-col justify-between gap-1.5 p-2.5">
                                    <span className="line-clamp-2 text-xs font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">
                                        {product.name}
                                    </span>
                                    {product.type === 'STOCKABLE' ? (
                                        <div className="mt-auto">
                                            {outOfStock ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-1.5 py-0.5 text-[10px] font-bold text-danger-700 border border-danger-200/70">
                                                    {t('inStock', { count: stockCount })}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-1.5 py-0.5 text-[10px] font-medium text-success-800 border border-success-200/50">
                                                    {t('inStock', { count: stockCount })}
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
                                </Div>
                            </button>
                        );
                    })}
                </Div>
            </Div>
        </Div>
    );
}

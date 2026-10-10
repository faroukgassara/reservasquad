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

function TileImage({ imageUrl, alt }: Readonly<{ imageUrl: string | null; alt: string }>) {
    if (!imageUrl) {
        return (
            <Div className="flex size-full items-center justify-center bg-gray-100">
                <Icon name={IconComponentsEnum.image} size={ESize.lg} color="text-gray-300" />
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
        <Div className="flex min-h-0 flex-1 flex-col">
            <Div className="flex items-center gap-2 border-b border-gray-200 bg-white p-3 sm:gap-3">
                <Div className="flex min-w-0 max-w-[45%] items-center gap-1 sm:max-w-none sm:flex-1">
                    <button
                        type="button"
                        onClick={() => setCategoryId(null)}
                        className="flex size-11 shrink-0 items-center justify-center gap-1 rounded-lg hover:bg-gray-100 sm:size-auto sm:px-2 sm:py-1.5"
                        aria-label={t('home')}
                    >
                        <Icon name={IconComponentsEnum.home} size={ESize.md} color="text-primary-500" />
                    </button>
                    {activeCategory ? (
                        <>
                            <Icon
                                name={IconComponentsEnum.chevronRight}
                                size={ESize.sm}
                                color="text-gray-400"
                                className="shrink-0 rtl:-scale-x-100"
                            />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-medium">
                                {activeCategory.name}
                            </Label>
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

            {/* Columns follow the grid's own width, which shrinks when the order panel sits beside it. */}
            <Div className="@container min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
                {!categoryId && !query && categories.length > 0 ? (
                    <Div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setCategoryId(category.id)}
                                className="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-start transition-colors hover:border-primary-300 hover:bg-primary-50"
                            >
                                <Div className="size-12 shrink-0 overflow-hidden rounded-lg">
                                    <TileImage imageUrl={category.imageUrl} alt={category.name} />
                                </Div>
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="line-clamp-2 font-semibold">
                                    {category.name}
                                </Label>
                            </button>
                        ))}
                    </Div>
                ) : null}

                {isLoading ? (
                    <Div className="flex justify-center py-12">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                ) : null}

                {!isLoading && visibleProducts.length === 0 ? (
                    <Div className="flex justify-center py-12">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {t('noProducts')}
                        </Label>
                    </Div>
                ) : null}

                <Div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6">
                    {visibleProducts.map((product) => {
                        const outOfStock = product.type === 'STOCKABLE' && toAmount(product.stockQty) <= 0;
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => onAdd(product)}
                                className={twMerge(
                                    'group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-start transition-shadow hover:border-primary-300 hover:shadow-md',
                                    outOfStock && 'opacity-70',
                                )}
                            >
                                <Div className="relative aspect-4/3 w-full overflow-hidden">
                                    <TileImage imageUrl={product.imageUrl} alt={product.name} />
                                    <span className="absolute end-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-0.5 shadow-sm">
                                        <Label variant={EVariantLabel.caption} color="text-primary-600" className="font-semibold tabular-nums">
                                            {formatMoney(toAmount(product.price))}
                                        </Label>
                                    </span>
                                </Div>
                                <Div className="flex flex-1 flex-col gap-0.5 p-2">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="line-clamp-2 font-medium">
                                        {product.name}
                                    </Label>
                                    {product.type === 'STOCKABLE' ? (
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color={outOfStock ? 'text-danger-600' : 'text-gray-500'}
                                        >
                                            {t('inStock', { count: toAmount(product.stockQty) })}
                                        </Label>
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

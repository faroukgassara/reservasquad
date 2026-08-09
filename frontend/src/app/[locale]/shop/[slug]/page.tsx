'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import {
    fetchPublicProductBySlug,
    fetchPublicProducts,
    getProductGallery,
    getProductSellPrice,
    type ProductRecord,
} from '@/lib/product-api';
import { useCart } from '@/contexts/CartContext';
import { twMerge } from 'tailwind-merge';
import { formatProductMoney } from '@/lib/product-api';

type DetailTab = 'description' | 'specs' | 'shipping';

function OptionChip({
    selected,
    onClick,
    children,
}: Readonly<{ selected: boolean; onClick: () => void; children: ReactNode }>) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={twMerge(
                'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                selected
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-primary-200 bg-white text-primary-500 hover:border-primary-400 hover:bg-primary-25',
            )}
        >
            {children}
        </button>
    );
}

function SimilarCard({
    product,
    locale,
}: Readonly<{ product: ProductRecord; locale: string }>) {
    const imageSrc = getProductGallery(product)[0] ?? '';
    const sellPrice = getProductSellPrice(product);
    const badges = product.badges ?? [];

    return (
        <Link href={Routes.Shop.detail(product.slug)} className="group flex flex-col">
            <Div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageSrc}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                {badges[0] ? (
                    <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase text-gray-900">
                        {badges[0]}
                    </span>
                ) : null}
            </Div>
            <Label variant={EVariantLabel.caption} color="text-primary-500" className="mt-3 uppercase">
                {product.category?.name ?? '—'}
            </Label>
            <Label variant={EVariantLabel.body} color="text-gray-900" className="mt-1 block">
                {product.title}
            </Label>
            <Label variant={EVariantLabel.body} color="text-primary-500" className="mt-2.5 block">
                {formatProductMoney(sellPrice, locale)}
            </Label>
        </Link>
    );
}

export default function ShopProductDetailPage() {
    const t = useTranslations('shop');
    const tDetail = useTranslations('shop.detail');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : '';
    const { addItem } = useCart();

    const {
        data: product,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['public-product', slug],
        queryFn: () => fetchPublicProductBySlug(slug),
        enabled: !!slug,
        retry: false,
    });

    const { data: similarResult } = useQuery({
        queryKey: ['public-products-similar', product?.categoryId],
        queryFn: () =>
            fetchPublicProducts({
                page: 1,
                perPage: 8,
                categoryId: product?.categoryId ?? undefined,
            }),
        enabled: !!product?.categoryId,
    });

    const similar = useMemo(() => {
        if (!product || !similarResult?.data) return [] as ProductRecord[];
        return similarResult.data.filter((p) => p.id !== product.id).slice(0, 3);
    }, [product, similarResult]);

    const gallery = useMemo(() => (product ? getProductGallery(product) : []), [product]);

    const [activeImage, setActiveImage] = useState(0);
    const [material, setMaterial] = useState('');
    const [size, setSize] = useState('');
    const [engraving, setEngraving] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [tab, setTab] = useState<DetailTab>('description');

    useEffect(() => {
        if (!product) return;
        setActiveImage(0);
        setMaterial(product.materials?.[0] ?? '');
        setSize(product.sizes?.[0] ?? '');
        setEngraving('');
        setQuantity(1);
    }, [product]);

    if (isLoading) {
        return (
            <Div className="flex items-center justify-center px-4 py-24">
                <Spinner color="text-primary-500" size={ESize.xl} />
            </Div>
        );
    }

    if (isError || !product) {
        return (
            <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-600">
                    {t('notFound')}
                </Label>
            </Div>
        );
    }

    const badges = product.badges ?? [];
    const materials = product.materials ?? [];
    const sizes = product.sizes ?? [];
    const sellPrice = getProductSellPrice(product);
    const tabs: { key: DetailTab; label: string }[] = [
        { key: 'description', label: tDetail('tabs.description') },
        { key: 'specs', label: tDetail('tabs.specs') },
        { key: 'shipping', label: tDetail('tabs.shipping') },
    ];

    const descriptionText =
        product.description?.trim() ||
        tDetail('longDescription', {
            name: product.title,
            short: product.description ?? '',
        });

    return (
        <section dir={isRtl ? 'rtl' : 'ltr'} className="bg-gray-25 pb-20 pt-6 sm:pt-8">
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <nav
                    aria-label={tDetail('breadcrumb')}
                    className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-gray-500"
                >
                    <Link href={Routes.Home} className="transition-colors hover:text-primary-500">
                        {tDetail('home')}
                    </Link>
                    <span aria-hidden className="text-gray-400">
                        ›
                    </span>
                    <Link href={Routes.Shop.index} className="transition-colors hover:text-primary-500">
                        {t('eyebrow')}
                    </Link>
                    <span aria-hidden className="text-gray-400">
                        ›
                    </span>
                    {product.category?.name ? (
                        <>
                            <Link
                                href={Routes.Shop.index}
                                className="transition-colors hover:text-primary-500"
                            >
                                {product.category.name}
                            </Link>
                            <span aria-hidden className="text-gray-400">
                                ›
                            </span>
                        </>
                    ) : null}
                    <span className="text-gray-800">{product.title}</span>
                </nav>

                <Div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
                    <Div>
                        <Div className="overflow-hidden rounded-2xl bg-gray-100">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.img
                                    key={gallery[activeImage] ?? gallery[0]}
                                    src={gallery[activeImage] ?? gallery[0]}
                                    alt=""
                                    initial={{ opacity: 0.4 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0.4 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="aspect-square w-full object-cover"
                                />
                            </AnimatePresence>
                        </Div>
                        {gallery.length > 1 && (
                            <Div className="mt-3.5 flex gap-3">
                                {gallery.map((src, index) => (
                                    <button
                                        key={`${src}-${index}`}
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        className={twMerge(
                                            'size-16 overflow-hidden rounded-xl ring-2 transition sm:size-20',
                                            activeImage === index
                                                ? 'ring-gold-400'
                                                : 'ring-transparent hover:ring-gray-200',
                                        )}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={src} alt="" className="size-full object-cover" />
                                    </button>
                                ))}
                            </Div>
                        )}
                    </Div>

                    <Div className="flex min-w-0 flex-col">
                        <Label variant={EVariantLabel.overline} color="text-primary-500" className="uppercase">
                            {product.category?.name ?? '—'}
                        </Label>

                        <Div className="mt-2">
                            <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                                {product.title}
                            </Label>
                        </Div>

                        <Div className="mt-4 flex flex-wrap items-center gap-3">
                            <Label variant={EVariantLabel.h4} color="text-primary-500">
                                {formatProductMoney(sellPrice, locale)}
                            </Label>
                            {product.discountedPrice != null && (
                                <span className="text-base text-gray-400 line-through">
                                    {formatProductMoney(product.price, locale)}
                                </span>
                            )}
                            {badges.map((badge) => (
                                <span
                                    key={badge}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-gray-900"
                                >
                                    {badge}
                                </span>
                            ))}
                        </Div>

                        {materials.length > 0 && (
                            <Div className="mt-7">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="mb-2.5 block"
                                >
                                    {tDetail('material')}
                                </Label>
                                <Div className="flex flex-wrap gap-2">
                                    {materials.map((option) => (
                                        <OptionChip
                                            key={option}
                                            selected={material === option}
                                            onClick={() => setMaterial(option)}
                                        >
                                            {option}
                                        </OptionChip>
                                    ))}
                                </Div>
                            </Div>
                        )}

                        {sizes.length > 0 && (
                            <Div className="mt-5">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="mb-2.5 block"
                                >
                                    {tDetail('size')}
                                </Label>
                                <Div className="flex flex-wrap gap-2">
                                    {sizes.map((option) => (
                                        <OptionChip
                                            key={option}
                                            selected={size === option}
                                            onClick={() => setSize(option)}
                                        >
                                            {option}
                                        </OptionChip>
                                    ))}
                                </Div>
                            </Div>
                        )}

                        {product.hasEngraving && (
                            <Div className="mt-5">
                                <Label
                                    htmlFor="engraving-text"
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="mb-2 block"
                                >
                                    {tDetail('engravingLabel')}
                                </Label>
                                <input
                                    id="engraving-text"
                                    type="text"
                                    value={engraving}
                                    onChange={(e) => setEngraving(e.target.value)}
                                    placeholder={tDetail('engravingPlaceholder')}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                                />
                            </Div>
                        )}

                        <Div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Div className="inline-flex h-12 items-center rounded-xl border border-primary-200 bg-white">
                                <button
                                    type="button"
                                    aria-label={tDetail('decreaseQty')}
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="flex size-11 items-center justify-center text-primary-500 transition-colors hover:bg-primary-25"
                                >
                                    −
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold text-gray-900">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    aria-label={tDetail('increaseQty')}
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="flex size-11 items-center justify-center text-primary-500 transition-colors hover:bg-primary-25"
                                >
                                    +
                                </button>
                            </Div>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() =>
                                    addItem({
                                        productId: product.id,
                                        slug: product.slug,
                                        title: product.title,
                                        imageUrl: product.imageUrl ?? gallery[0] ?? '',
                                        unitPrice: sellPrice,
                                        quantity,
                                        materialKey: material || undefined,
                                        sizeKey: size || undefined,
                                        engraving:
                                            product.hasEngraving && engraving.trim()
                                                ? engraving.trim()
                                                : undefined,
                                    })
                                }
                                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                            >
                                <Icon name={IconComponentsEnum.plus} size={ESize.sm} color="text-white" />
                                {tDetail('addToCart')}
                            </motion.button>
                        </Div>

                        <Div className="mt-4 space-y-2.5 rounded-2xl bg-gray-100 px-4 py-3.5">
                            <Div className="flex items-center gap-2.5">
                                <Icon name={IconComponentsEnum.truck} size={ESize.sm} color="text-gold-500" />
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                                    {tDetail('deliveryEverywhere')}
                                </Label>
                            </Div>
                            <Div className="flex items-center gap-2.5">
                                <Icon
                                    name={IconComponentsEnum.checkCircle}
                                    size={ESize.sm}
                                    color="text-gold-500"
                                />
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                                    {tDetail('handmadeGuarantee')}
                                </Label>
                            </Div>
                        </Div>
                    </Div>
                </Div>

                <Div className="mt-14 border-t border-gray-200 pt-1 sm:mt-16">
                    <Div className="flex gap-8 overflow-x-auto border-b border-gray-200">
                        {tabs.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={twMerge(
                                    'shrink-0 border-b-2 px-0.5 py-3.5 text-sm font-medium transition-colors',
                                    tab === item.key
                                        ? 'border-gold-400 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-800',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </Div>
                    <Div className="max-w-3xl py-7">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                {tab === 'description' && (
                                    <Label variant={EVariantLabel.body} color="text-gray-600" className="block">
                                        {descriptionText}
                                    </Label>
                                )}
                                {tab === 'specs' && (
                                    <ul className="space-y-2.5">
                                        {material ? (
                                            <li>
                                                <Label variant={EVariantLabel.body} color="text-gray-600">
                                                    {tDetail('specsList.material', { value: material })}
                                                </Label>
                                            </li>
                                        ) : null}
                                        {size ? (
                                            <li>
                                                <Label variant={EVariantLabel.body} color="text-gray-600">
                                                    {tDetail('specsList.size', { value: size })}
                                                </Label>
                                            </li>
                                        ) : null}
                                        <li>
                                            <Label variant={EVariantLabel.body} color="text-gray-600">
                                                {tDetail('specsList.origin')}
                                            </Label>
                                        </li>
                                        <li>
                                            <Label variant={EVariantLabel.body} color="text-gray-600">
                                                {tDetail('specsList.finish')}
                                            </Label>
                                        </li>
                                    </ul>
                                )}
                                {tab === 'shipping' && (
                                    <Label variant={EVariantLabel.body} color="text-gray-600" className="block">
                                        {tDetail('shippingBody')}
                                    </Label>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Div>
                </Div>

                {similar.length > 0 && (
                    <Div className="mt-4 sm:mt-6">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className="mb-8 block">
                            {tDetail('similarTitle')}
                        </Label>
                        <Div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {similar.map((item) => (
                                <SimilarCard key={item.id} product={item} locale={locale} />
                            ))}
                        </Div>
                    </Div>
                )}
            </Div>
        </section>
    );
}

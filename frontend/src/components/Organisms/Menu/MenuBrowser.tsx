'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getMediaUrl } from '@/lib/media-url';
import type { ELabelColor } from '@/theme/labelColors';

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
}

export interface MenuSection {
    id: string;
    name: string;
    imageUrl: string | null;
    products: MenuItem[];
}

interface IMenuBrowser {
    /** `null` when the menu could not be loaded. */
    sections: MenuSection[] | null;
    logoAlt: string;
}

interface ITone {
    solid: string;
    soft: string;
    ring: string;
    dot: string;
    text: ELabelColor;
}

const TONES: ITone[] = [
    {
        solid: 'bg-gradient-to-br from-primary-600 to-primary-400',
        soft: 'bg-primary-50',
        ring: 'ring-primary-400',
        dot: 'bg-primary-500',
        text: 'text-primary-700',
    },
    {
        solid: 'bg-gradient-to-br from-accent-600 to-accent-400',
        soft: 'bg-accent-50',
        ring: 'ring-accent-400',
        dot: 'bg-accent-500',
        text: 'text-accent-700',
    },
    {
        solid: 'bg-gradient-to-br from-success-600 to-success-400',
        soft: 'bg-success-50',
        ring: 'ring-success-400',
        dot: 'bg-success-500',
        text: 'text-success-700',
    },
    {
        solid: 'bg-gradient-to-br from-warning-600 to-warning-400',
        soft: 'bg-warning-50',
        ring: 'ring-warning-400',
        dot: 'bg-warning-500',
        text: 'text-warning-700',
    },
];

const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 }).format(value);

/** Case- and accent-insensitive, so "cafe" finds "Café". */
const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

function Thumbnail({
    imageUrl,
    name,
    tone,
    className,
}: Readonly<{ imageUrl: string | null; name: string; tone: ITone; className?: string }>) {
    const src = imageUrl ? getMediaUrl(imageUrl) : '';
    return (
        <div
            className={twMerge(
                'relative flex shrink-0 items-center justify-center overflow-hidden',
                src ? 'bg-gray-50' : tone.solid,
                className,
            )}
        >
            {src ? (
                <Image
                    src={src}
                    alt={name}
                    fill
                    sizes="64px"
                    unoptimized={src.startsWith('data:') || src.startsWith('blob:')}
                    className="object-cover"
                />
            ) : (
                <span aria-hidden="true" className="text-lg font-bold text-white uppercase select-none">
                    {name.trim().charAt(0)}
                </span>
            )}
        </div>
    );
}

function ProductCard({ product, tone }: Readonly<{ product: MenuItem; tone: ITone }>) {
    return (
        <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-2xs transition-shadow hover:shadow-md">
            <Thumbnail imageUrl={product.imageUrl} name={product.name} tone={tone} className="size-14 rounded-xl" />
            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="min-w-0 flex-1 line-clamp-2 font-semibold">
                {product.name}
            </Label>
            <Label variant={EVariantLabel.body} color={tone.text} className="shrink-0 pe-1.5 font-bold! whitespace-nowrap tabular-nums">
                {formatPrice(product.price)}
            </Label>
        </li>
    );
}

export default function MenuBrowser({ sections, logoAlt }: Readonly<IMenuBrowser>) {
    const t = useTranslations('menu');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const toneFor = useMemo(() => {
        const map = new Map((sections ?? []).map((section, index) => [section.id, TONES[index % TONES.length]]));
        return (id: string) => map.get(id) ?? TONES[0];
    }, [sections]);

    const searching = normalize(query).length > 0;
    const visibleSections = useMemo(() => {
        if (!sections) return [];
        if (searching) {
            const needle = normalize(query);
            return sections
                .map((section) => ({
                    ...section,
                    products: section.products.filter((product) => normalize(product.name).includes(needle)),
                }))
                .filter((section) => section.products.length > 0);
        }
        return selectedId ? sections.filter((section) => section.id === selectedId) : sections;
    }, [sections, query, searching, selectedId]);

    const totalProducts = sections?.reduce((sum, section) => sum + section.products.length, 0) ?? 0;
    const resultCount = visibleSections.reduce((sum, section) => sum + section.products.length, 0);
    const hasMenu = Boolean(sections && sections.length > 0);

    const renderEmptyState = (message: string, icon?: IconComponentsEnum) => (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
            {icon ? <Icon name={icon} size={ESize.md} color="text-gray-400" /> : null}
            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                {message}
            </Label>
        </div>
    );

    const renderProducts = () => {
        if (sections === null) return renderEmptyState(t('loadError'));
        if (sections.length === 0) return renderEmptyState(t('empty'));
        if (searching && visibleSections.length === 0) {
            return renderEmptyState(t('noResults', { query: query.trim() }), IconComponentsEnum.search);
        }

        return (
            <div className="space-y-8">
                {searching ? (
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="block">
                        {t('resultsCount', { count: resultCount })}
                    </Label>
                ) : null}
                {visibleSections.map((section) => {
                    const tone = toneFor(section.id);
                    return (
                        <section key={section.id} className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <span className={twMerge('h-6 w-1.5 rounded-full', tone.dot)} />
                                <Label variant={EVariantLabel.h5} color="text-gray-900" className="truncate">
                                    {section.name}
                                </Label>
                                <span
                                    className={twMerge(
                                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2',
                                        tone.solid,
                                    )}
                                >
                                    <Label variant={EVariantLabel.caption} color="text-white" className="block leading-none! font-semibold">
                                        {section.products.length}
                                    </Label>
                                </span>
                            </div>
                            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {section.products.map((product) => (
                                    <ProductCard key={product.id} product={product} tone={tone} />
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-dvh bg-gray-25">
            <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <BrandLogo alt={logoAlt} height={26} className="w-auto object-contain" priority />
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher menuPlacement="top" className="w-auto" />
                        <ThemeToggle />
                    </div>
                </div>
                {hasMenu ? (
                    <div className="mx-auto w-full max-w-4xl px-4 pb-3 sm:px-6">
                        <Input
                            id="menu-search"
                            leftIcon="search"
                            placeholder={t('searchPlaceholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                ) : null}
            </header>

            <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-500 px-6 py-6 shadow-lg sm:px-8 sm:py-8">
                    <div aria-hidden="true" className="absolute -end-12 -top-16 size-48 rounded-full bg-accent-500/30 blur-2xl" />
                    <div aria-hidden="true" className="absolute -bottom-20 end-1/3 size-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <Label variant={EVariantLabel.h3} color="text-white">
                                {t('title')}
                            </Label>
                            <Label variant={EVariantLabel.bodySmall} color="text-white" className="opacity-80">
                                {t('subtitle')}
                            </Label>
                        </div>
                        {hasMenu && sections ? (
                            <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3.5 py-1.5 ring-1 ring-white/25">
                                <Label variant={EVariantLabel.caption} color="text-white" className="font-medium">
                                    {t('summary', { categories: sections.length, products: totalProducts })}
                                </Label>
                            </span>
                        ) : null}
                    </div>
                </div>

                {hasMenu && sections && !searching ? (
                    <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
                        {sections.map((section) => {
                            const tone = toneFor(section.id);
                            const selected = selectedId === section.id;
                            return (
                                <button
                                    key={section.id}
                                    id={`menu-category-${section.id}`}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setSelectedId(selected ? null : section.id)}
                                    className={twMerge(
                                        'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-start shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-md',
                                        selected && ['ring-2', tone.ring, tone.soft],
                                    )}
                                >
                                    <Thumbnail
                                        imageUrl={section.imageUrl}
                                        name={section.name}
                                        tone={tone}
                                        className="size-11 rounded-xl"
                                    />
                                    <span className="flex min-w-0 flex-col">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="cursor-pointer truncate font-semibold">
                                            {section.name}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="cursor-pointer">
                                            {t('productCount', { count: section.products.length })}
                                        </Label>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                {selectedId && !searching ? (
                    <button
                        id="menu-show-all"
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 transition-colors hover:bg-gray-50"
                    >
                        <Icon name={IconComponentsEnum.close} size={ESize.xs} color="text-gray-500" />
                        <Label variant={EVariantLabel.caption} color="text-gray-700" className="cursor-pointer font-medium">
                            {t('showAll')}
                        </Label>
                    </button>
                ) : null}

                {renderProducts()}

                <Label variant={EVariantLabel.caption} color="text-gray-400" className="block pb-4 text-center">
                    {t('footer')}
                </Label>
            </main>
        </div>
    );
}

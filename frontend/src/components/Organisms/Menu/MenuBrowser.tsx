'use client';

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

const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 }).format(value);

/** Case- and accent-insensitive, so "cafe" finds "Café". */
const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

function Picture({ imageUrl, name, className }: Readonly<{ imageUrl: string | null; name: string; className?: string }>) {
    return (
        <div className={twMerge('flex items-center justify-center overflow-hidden bg-primary-50', className)}>
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(imageUrl)} alt={name} loading="lazy" className="size-full object-cover" />
            ) : (
                <Label variant={EVariantLabel.h5} color="text-primary-600" className="uppercase select-none">
                    {name.trim().charAt(0)}
                </Label>
            )}
        </div>
    );
}

export default function MenuBrowser({ sections, logoAlt }: Readonly<IMenuBrowser>) {
    const t = useTranslations('menu');
    const [query, setQuery] = useState('');
    const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(sections?.[0] ? [sections[0].id] : []));

    const searching = normalize(query).length > 0;
    const visibleSections = useMemo(() => {
        if (!sections) return [];
        if (!searching) return sections;
        const needle = normalize(query);
        return sections
            .map((section) => ({
                ...section,
                products: section.products.filter((product) => normalize(product.name).includes(needle)),
            }))
            .filter((section) => section.products.length > 0);
    }, [sections, query, searching]);

    const totalProducts = sections?.reduce((sum, section) => sum + section.products.length, 0) ?? 0;
    const resultCount = visibleSections.reduce((sum, section) => sum + section.products.length, 0);

    const toggle = (id: string) =>
        setOpenIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const renderBody = () => {
        if (sections === null) {
            return (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                        {t('loadError')}
                    </Label>
                </div>
            );
        }
        if (sections.length === 0) {
            return (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                        {t('empty')}
                    </Label>
                </div>
            );
        }
        if (searching && visibleSections.length === 0) {
            return (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                    <Icon name={IconComponentsEnum.search} size={ESize.md} color="text-gray-400" />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                        {t('noResults', { query: query.trim() })}
                    </Label>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {searching ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block px-1">
                        {t('resultsCount', { count: resultCount })}
                    </Label>
                ) : null}
                {visibleSections.map((section) => {
                    const open = searching || openIds.has(section.id);
                    const panelId = `menu-panel-${section.id}`;
                    return (
                        <section key={section.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={panelId}
                                onClick={() => toggle(section.id)}
                                disabled={searching}
                                className="flex min-h-16 w-full cursor-pointer items-center gap-3 p-3 text-start transition-colors hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-transparent"
                            >
                                <Picture imageUrl={section.imageUrl} name={section.name} className="size-12 shrink-0 rounded-xl" />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <Label variant={EVariantLabel.h6} color="text-gray-900" className="truncate">
                                        {section.name}
                                    </Label>
                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                        {t('productCount', { count: section.products.length })}
                                    </Label>
                                </div>
                                {searching ? null : (
                                    <Icon
                                        name={IconComponentsEnum.chevronDown}
                                        size={ESize.sm}
                                        color="text-gray-500"
                                        className={twMerge('shrink-0 transition-transform duration-200', open && 'rotate-180')}
                                    />
                                )}
                            </button>
                            {open ? (
                                <ul id={panelId} className="grid grid-cols-2 gap-3 border-t border-gray-100 p-3 tablet:grid-cols-3">
                                    {section.products.map((product) => (
                                        <li key={product.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
                                            <Picture imageUrl={product.imageUrl} name={product.name} className="aspect-square w-full" />
                                            <div className="flex flex-1 flex-col justify-between gap-1 p-2.5">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="line-clamp-2 font-semibold">
                                                    {product.name}
                                                </Label>
                                                <Label variant={EVariantLabel.bodySmall} color="text-primary-700" className="font-semibold tabular-nums">
                                                    {formatPrice(product.price)}
                                                </Label>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </section>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-dvh bg-gray-25">
            <header className="sticky top-0 z-20 border-b border-gray-100 bg-white">
                <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <BrandLogo alt={logoAlt} height={26} className="w-auto object-contain" priority />
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher menuPlacement="top" className="w-auto" />
                        <ThemeToggle />
                    </div>
                </div>
                {sections && sections.length > 0 ? (
                    <div className="mx-auto w-full max-w-3xl px-4 pb-3 sm:px-6">
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

            <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">
                <div className="flex items-end justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                        <Label variant={EVariantLabel.h4} color="text-gray-900">
                            {t('title')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {t('subtitle')}
                        </Label>
                    </div>
                    {sections && sections.length > 0 ? (
                        <Label variant={EVariantLabel.caption} color="text-gray-400" className="shrink-0 text-end">
                            {t('summary', { categories: sections.length, products: totalProducts })}
                        </Label>
                    ) : null}
                </div>
                {renderBody()}
                <Label variant={EVariantLabel.caption} color="text-gray-400" className="block text-center">
                    {t('footer')}
                </Label>
            </main>
        </div>
    );
}

'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Icon from '@/components/Primitives/Icon/Icon';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import FaqAccordion from '@/components/Primitives/FaqAccordion/FaqAccordion';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { fetchPublicFaqCategories, type PublicFaqCategory } from '@/lib/faq-api';
import { HOME_CTA_LINK, HOME_SECTION_BODY, HOME_SECTION_FOOTER, HOME_SECTION_HEADER, HOME_SECTION_INNER, HOME_SECTION_SUBTITLE, HOME_SECTION_TITLE, HOME_VIEWPORT_SECTION } from '@/lib/home-layout';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';

interface TemplateFaqProps {
    limit?: number;
    showViewAllLink?: boolean;
}

function filterCategories(categories: PublicFaqCategory[], search: string): PublicFaqCategory[] {
    const query = search.trim().toLowerCase();
    if (!query) return categories;

    return categories
        .map((category) => {
            const faqs = category.faqs.filter(
                (faq) =>
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query),
            );
            const categoryMatch =
                category.name.toLowerCase().includes(query) ||
                (category.description ?? '').toLowerCase().includes(query);

            if (!categoryMatch && faqs.length === 0) return null;
            return { ...category, faqs: categoryMatch ? category.faqs : faqs };
        })
        .filter(Boolean) as PublicFaqCategory[];
}

function FaqCategoryPanel({
    categories,
    activeCategoryId,
    onSelectCategory,
    faqLimit,
    compact = false,
}: Readonly<{
    categories: PublicFaqCategory[];
    activeCategoryId: string | null;
    onSelectCategory: (id: string) => void;
    faqLimit?: number;
    compact?: boolean;
}>) {
    const t = useTranslations('home.faq');
    const tFaq = useTranslations('faqPage');
    const activeCategory = categories.find((c) => c.id === activeCategoryId);
    let faqItems = activeCategory?.faqs ?? [];
    if (activeCategory && faqLimit) {
        faqItems = activeCategory.faqs.slice(0, faqLimit);
    }

    return (
        <Div className={twMerge('overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg', compact ? 'p-3 sm:p-4' : 'rounded-2xl p-4 sm:p-6 lg:p-8')}>
            <Div className={twMerge('grid', compact ? 'gap-3 lg:grid-cols-[minmax(0,180px)_1fr] lg:gap-6' : 'gap-6 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-10')}>
                <Div className="flex flex-col">
                    {!compact && (
                        <>
                            <span className="inline-flex w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
                                {t('panelBadge')}
                            </span>
                            <Label
                                variant={EVariantLabel.h5}
                                color="text-gray-900"
                                className="mt-3"
                            >
                                {t('panelTitle')}
                            </Label>
                        </>
                    )}

                    <nav
                        className={twMerge(
                            'flex gap-1',
                            compact ? 'flex-row overflow-hidden lg:mt-0 lg:flex-col' : 'mt-4 flex-row overflow-x-auto lg:mt-6 lg:flex-col lg:overflow-visible',
                        )}
                        aria-label={tFaq('categoriesAria')}
                    >
                        {categories.map((category) => {
                            const isActive = category.id === activeCategoryId;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => onSelectCategory(category.id)}
                                    className={twMerge(
                                        'rounded-lg text-left font-medium transition-colors',
                                        compact ? 'shrink-0 px-2.5 py-1.5 text-xs sm:text-sm' : 'rounded-xl px-4 py-3 text-sm',
                                        isActive
                                            ? 'bg-primary-50 text-gray-900'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                                    )}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                    </nav>
                </Div>

                <Div className="min-w-0 overflow-hidden">
                    {faqItems.length > 0 ? (
                        <FaqAccordion items={faqItems} toggleStyle="plus" compact={compact} />
                    ) : (
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                            {compact ? t('noQuestionsInCategory') : tFaq('noQuestionsInCategory')}
                        </Label>
                    )}
                </Div>
            </Div>
        </Div>
    );
}

function FaqHelpCenterPage({ categories, isLoading }: Readonly<{ categories: PublicFaqCategory[]; isLoading: boolean }>) {
    const tFaq = useTranslations('faqPage');
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const filteredCategories = useMemo(() => filterCategories(categories, search), [categories, search]);

    const activeCategoryId =
        selectedCategoryId && filteredCategories.some((c) => c.id === selectedCategoryId)
            ? selectedCategoryId
            : filteredCategories[0]?.id ?? null;

    let mainSection: ReactNode;
    if (isLoading) {
        mainSection = (
            <Div className="flex justify-center py-20">
                <Spinner color="text-primary-500" size={ESize.xl} />
            </Div>
        );
    } else if (filteredCategories.length === 0) {
        mainSection = (
            <Div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    {search ? tFaq('noResults') : tFaq('noCategories')}
                </Label>
            </Div>
        );
    } else {
        mainSection = (
            <Div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <FaqCategoryPanel
                    categories={filteredCategories}
                    activeCategoryId={activeCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                />
            </Div>
        );
    }

    return (
        <Div role="region" aria-labelledby="faq-heading" className="bg-gray-50">
            <Div className="border-b border-gray-100 bg-white">
                <Div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8">
                    <Label
                        variant={EVariantLabel.h3}
                        color="text-gray-900"
                    >
                        {tFaq('heroTitle')}
                    </Label>

                    <Div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch">
                        <Input
                            id="faq-search"
                            placeholder={tFaq('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={IconComponentsEnum.search}
                            containerClassName="flex-1"
                            className="h-12 border-gray-200"
                        />
                        <Button
                            id="faq-search-btn"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={tFaq('search')}
                            className="h-12 shrink-0 px-8 sm:w-auto w-full"
                        />
                    </Div>

                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-4 block">
                        {tFaq('orChooseCategory')}
                    </Label>
                </Div>
            </Div>

            {mainSection}

            <Div className="border-t border-gray-100 bg-white">
                <Div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8 flex flex-col items-center">
                    <Label variant={EVariantLabel.h5} color="text-gray-900">
                        {tFaq('stillHaveQuestion')}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mx-auto mt-2 block max-w-lg">
                        {tFaq('stillHaveQuestionBody')}
                    </Label>

                    <Div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <Div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <Icon name={IconComponentsEnum.user} color="text-primary-500" size={ESize.lg} />
                            <a href="tel:+33100000000" className="mt-4 block">
                                <Label variant={EVariantLabel.bodyLarge} color="text-primary-600">
                                    +216 95275812
                                </Label>
                            </a>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-2 block">
                                {tFaq('phoneHelp')}
                            </Label>
                        </Div>
                        <Div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <Icon name={IconComponentsEnum.info} color="text-primary-500" size={ESize.lg} />
                            <a href="mailto:contact@bibliosquad.tn" className="mt-4 block">
                                <Label variant={EVariantLabel.bodyLarge} color="text-primary-600">
                                    contact@bibliosquad.tn
                                </Label>
                            </a>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-2 block">
                                {tFaq('emailHelp')}
                            </Label>
                        </Div>
                    </Div>

                    <Link
                        href={Routes.Contact}
                        className="mt-6 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        {tFaq('goToContact')}
                    </Link>
                </Div>
            </Div>
        </Div>
    );
}

function FaqHomeSection({
    categories,
    isLoading,
    limit,
    showViewAllLink,
}: Readonly<{
    categories: PublicFaqCategory[];
    isLoading: boolean;
    limit?: number;
    showViewAllLink: boolean;
}>) {
    const t = useTranslations('home.faq');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const visibleCategories = useMemo(
        () => categories.filter((c) => c.faqs.length > 0),
        [categories],
    );

    const activeCategoryId =
        selectedCategoryId && visibleCategories.some((c) => c.id === selectedCategoryId)
            ? selectedCategoryId
            : visibleCategories[0]?.id ?? null;

    let contentSection: ReactNode;
    if (isLoading) {
        contentSection = (
            <Div className="flex flex-1 items-center justify-center">
                <Spinner color="text-primary-500" size={ESize.xl} />
            </Div>
        );
    } else if (visibleCategories.length === 0) {
        contentSection = (
            <Div className="flex flex-1 items-center justify-center text-center">
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    {t('empty')}
                </Label>
            </Div>
        );
    } else {
        contentSection = (
            <>
                <Div className={HOME_SECTION_BODY}>
                    <FaqCategoryPanel
                        categories={visibleCategories}
                        activeCategoryId={activeCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                        faqLimit={limit}
                        compact
                    />
                </Div>

                {showViewAllLink && (
                    <Div className={HOME_SECTION_FOOTER}>
                        <Link id="view-all-faqs" href={Routes.Faq} className={HOME_CTA_LINK}>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                {t('viewAll')}
                            </Label>
                            <Icon name={IconComponentsEnum.arrowRight} size={ESize.sm} color="text-gray-700" />
                        </Link>
                    </Div>
                )}
            </>
        );
    }

    return (
        <Div role="region" aria-labelledby="faq-heading" className={twMerge(HOME_VIEWPORT_SECTION, 'overflow-hidden bg-white')}>
            <Div className={HOME_SECTION_INNER}>
                <Div className={HOME_SECTION_HEADER}>
                    <Label variant={EVariantLabel.overline} color="text-primary-600" className="mb-1 block uppercase">
                        {t('eyebrow')}
                    </Label>
                    <Div id="faq-heading">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className={HOME_SECTION_TITLE}>
                            {t('title')}
                        </Label>
                    </Div>
                    <p className={HOME_SECTION_SUBTITLE}>
                        {t('subtitle')}
                    </p>
                </Div>

                {contentSection}
            </Div>
        </Div>
    );
}

export default function TemplateFaq({ limit, showViewAllLink = false }: Readonly<TemplateFaqProps>) {
    const isFullPage = limit === undefined && !showViewAllLink;

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['public-faq-categories'],
        queryFn: fetchPublicFaqCategories,
    });

    if (isFullPage) {
        return <FaqHelpCenterPage categories={categories} isLoading={isLoading} />;
    }

    return (
        <FaqHomeSection
            categories={categories}
            isLoading={isLoading}
            limit={limit}
            showViewAllLink={showViewAllLink}
        />
    );
}

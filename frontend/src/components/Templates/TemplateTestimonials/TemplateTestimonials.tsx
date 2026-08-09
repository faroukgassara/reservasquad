'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import TestimonialCard from '@/components/Primitives/TestimonialCard/TestimonialCard';
import { EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { HOME_SECTION_INNER, HOME_VIEWPORT_SECTION } from '@/lib/home-layout';
import { fetchPublicTestimonials } from '@/lib/testimonial-api';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';

function getCardsPerPage(isXl: boolean, isLg: boolean, isSm: boolean): number {
    if (isXl) return 4;
    if (isLg) return 3;
    if (isSm) return 2;
    return 1;
}

function getGridClassName(cardsPerPage: number): string {
    if (cardsPerPage >= 4) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
    if (cardsPerPage === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (cardsPerPage === 2) return 'grid-cols-2';
    return 'grid-cols-1 max-w-md mx-auto';
}

const CAROUSEL_NAV_CLASS = 'shrink-0 rounded-full border border-gray-300 bg-white shadow-md transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-lg disabled:pointer-events-none disabled:opacity-35';

export default function TemplateTestimonials() {
    const t = useTranslations('home.testimonials');
    const [carouselPage, setCarouselPage] = useState(0);
    const isSm = useMediaQuery('(min-width: 640px)');
    const isLg = useMediaQuery('(min-width: 1024px)');
    const isXl = useMediaQuery('(min-width: 1280px)');
    const cardsPerPage = getCardsPerPage(isXl, isLg, isSm);

    const { data: testimonials = [], isLoading } = useQuery({
        queryKey: ['public-testimonials'],
        queryFn: () => fetchPublicTestimonials(24),
        staleTime: 60_000,
    });

    const totalSlidePages = Math.max(1, Math.ceil(testimonials.length / cardsPerPage));

    const visibleTestimonials = useMemo(() => {
        const start = carouselPage * cardsPerPage;
        return testimonials.slice(start, start + cardsPerPage);
    }, [testimonials, carouselPage, cardsPerPage]);

    useEffect(() => {
        const maxPage = Math.max(0, totalSlidePages - 1);
        setCarouselPage((p) => Math.min(p, maxPage));
    }, [totalSlidePages, cardsPerPage]);

    const goToPrev = () => setCarouselPage((p) => Math.max(0, p - 1));
    const goToNext = () => setCarouselPage((p) => Math.min(totalSlidePages - 1, p + 1));

    if (!isLoading && testimonials.length === 0) {
        return null;
    }

    let carouselSection: ReactNode = null;
    if (isLoading) {
        carouselSection = (
            <Div className="flex flex-1 items-center justify-center">
                <Spinner color="text-primary-500" size={ESize.xl} />
            </Div>
        );
    } else {
        carouselSection = (
            <Div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                <Div className="flex w-full max-w-6xl items-center gap-3 sm:gap-4">
                    {totalSlidePages > 1 && (
                        <Button
                            id="testimonials-carousel-prev"
                            type={EButtonType.secondary}
                            className={twMerge(CAROUSEL_NAV_CLASS, 'size-9 sm:size-10')}
                            onClick={goToPrev}
                            disabled={carouselPage === 0}
                            aria-label={t('prev')}
                            icon={{
                                name: IconComponentsEnum.chevronLeft,
                                size: ESize.sm,
                                color: 'text-gray-800',
                            }}
                            iconPosition="only"
                        />
                    )}

                    <Div
                        className={twMerge(
                            'grid min-w-0 flex-1 auto-rows-fr gap-4 lg:gap-5',
                            getGridClassName(cardsPerPage),
                        )}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {visibleTestimonials.map((testimonial) => (
                            <TestimonialCard key={testimonial.id} testimonial={testimonial} compact />
                        ))}
                    </Div>

                    {totalSlidePages > 1 && (
                        <Button
                            id="testimonials-carousel-next"
                            type={EButtonType.secondary}
                            className={twMerge(CAROUSEL_NAV_CLASS, 'size-9 sm:size-10')}
                            onClick={goToNext}
                            disabled={carouselPage >= totalSlidePages - 1}
                            aria-label={t('next')}
                            icon={{
                                name: IconComponentsEnum.chevronRight,
                                size: ESize.sm,
                                color: 'text-gray-800',
                            }}
                            iconPosition="only"
                        />
                    )}
                </Div>

                {totalSlidePages > 1 && (
                    <Div className="mt-5 hidden items-center justify-center gap-2 sm:mt-6 sm:flex">
                        {Array.from({ length: totalSlidePages }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Page ${i + 1}`}
                                aria-current={i === carouselPage ? 'true' : undefined}
                                onClick={() => setCarouselPage(i)}
                                className={
                                    i === carouselPage
                                        ? 'h-2 w-8 rounded-full bg-primary-500 transition-colors'
                                        : 'h-2 w-2 rounded-full bg-gray-300 transition-colors hover:bg-gray-400'
                                }
                            />
                        ))}
                    </Div>
                )}
            </Div>
        );
    }

    return (
        <Div
            role="region"
            aria-labelledby="testimonials-heading"
            className={twMerge(
                HOME_VIEWPORT_SECTION,
                'overflow-hidden bg-gray-50',
            )}
        >
            <Div className={HOME_SECTION_INNER}>
            <Div className="mb-4 max-w-3xl shrink-0 sm:mb-5 lg:mb-6">
                    <Label
                        variant={EVariantLabel.overline}
                        color="text-gold-600"
                        className="mb-2 block uppercase"
                    >
                        {t('eyebrow')}
                    </Label>
                    <Div id="our-services-heading">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                            {t('title')}
                        </Label>
                    </Div>
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-600"
                        className="mt-2 block max-w-2xl sm:mt-3"
                    >
                        {t('subtitle')}
                    </Label>
                </Div>

                {carouselSection}
            </Div>
        </Div>
    );
}

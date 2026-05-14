'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { Div, Icon, Label, Spinner } from '@/components/Atoms';
import MoleculeFormationCard from '@/components/Molecules/MoleculeFormationCard/MoleculeFormationCard';
import { EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { fetchPublicFormations } from '@/lib/formation-api';
import { Routes } from '@/lib/routes';

const CARDS_PER_PAGE = 3;

export default function TemplatePopularFormations() {
    const [carouselPage, setCarouselPage] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['public-formations-popular'],
        queryFn: () =>
            fetchPublicFormations({
                page: 1,
                perPage: 12,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }),
        staleTime: 60_000,
    });

    const formations = data?.data ?? [];
    const totalSlidePages = Math.max(1, Math.ceil(formations.length / CARDS_PER_PAGE));

    const visibleFormations = useMemo(() => {
        const start = carouselPage * CARDS_PER_PAGE;
        return formations.slice(start, start + CARDS_PER_PAGE);
    }, [formations, carouselPage]);

    useEffect(() => {
        const maxPage = Math.max(0, totalSlidePages - 1);
        setCarouselPage((p) => Math.min(p, maxPage));
    }, [totalSlidePages]);

    let listSection: ReactNode = null;
    if (isLoading) {
        listSection = (
            <Div className="flex justify-center py-20">
                <Spinner color="text-primary-500" size="w-10 h-10" />
            </Div>
        );
    } else if (formations.length === 0) {
        listSection = (
            <Div className="py-16 text-center">
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    Aucune formation disponible pour le moment.
                </Label>
            </Div>
        );
    } else {
        listSection = (
            <>
                <Div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {visibleFormations.map((f) => (
                        <MoleculeFormationCard key={f.id} formation={f} href={Routes.Login} />
                    ))}
                </Div>

                {totalSlidePages > 1 && (
                    <Div className="mt-10 flex justify-center gap-2">
                        {Array.from({ length: totalSlidePages }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Page ${i + 1}`}
                                onClick={() => setCarouselPage(i)}
                                className={
                                    i === carouselPage
                                        ? 'h-2 w-8 rounded-full bg-primary-500 transition-colors'
                                        : 'h-2 w-2 rounded-full bg-gray-200 transition-colors hover:bg-gray-300'
                                }
                            />
                        ))}
                    </Div>
                )}

                <Div className="mt-10 flex justify-center">
                    <Link
                        id="explore-all-programs"
                        href={Routes.Login}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-8 font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                            Explore All Programs
                        </Label>
                        <Icon name={IconComponentsEnum.arrowRight} size="w-5 h-5" color="text-gray-700" />
                    </Link>
                </Div>
            </>
        );
    }

    return (
        <Div role="region" className="bg-white py-16 sm:py-20">
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Div className="mx-auto max-w-2xl text-center">
                    <Label variant={EVariantLabel.bodySmall} color="text-success-600" className="mb-3 block font-semibold uppercase tracking-wide">
                        Explore Programs
                    </Label>
                    <Label variant={EVariantLabel.h2} color="text-gray-900" className="mb-4 block font-bold">
                        Our Most Popular Class
                    </Label>
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500" className="block">
                        Let&apos;s join our famous class, the knowledge provided will definitely be useful for you.
                    </Label>
                </Div>

                {listSection}
            </Div>
        </Div>
    );
}

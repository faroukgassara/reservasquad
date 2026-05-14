'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { Div, Icon, Label, Spinner } from '@/components/Atoms';
import MoleculeBlogCard from '@/components/Molecules/MoleculeBlogCard/MoleculeBlogCard';
import { EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { fetchPublicBlogs } from '@/lib/blog-api';
import { Routes } from '@/lib/routes';

export default function TemplateRecentBlogs() {
    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['public-blogs-recent'],
        queryFn: () => fetchPublicBlogs(12),
        staleTime: 60_000,
    });

    const featured = blogs[0];
    const side = blogs.slice(1, 3);
    const singleColumn = blogs.length === 1;

    let section: ReactNode = null;
    if (isLoading) {
        section = (
            <Div className="flex justify-center py-20">
                <Spinner color="text-primary-500" size="w-10 h-10" />
            </Div>
        );
    } else if (!featured) {
        section = (
            <Div className="py-16 text-center">
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    Aucun article pour le moment.
                </Label>
            </Div>
        );
    } else {
        section = (
            <>
                <Div
                    className={
                        singleColumn
                            ? 'mx-auto mt-12 max-w-xl'
                            : 'mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10'
                    }
                >
                    {!singleColumn && (
                        <Div className="flex flex-col gap-6">
                            {side.map((b) => (
                                <MoleculeBlogCard
                                    key={b.id}
                                    blog={b}
                                    href={Routes.Blogs.post(b.slug)}
                                    variant="horizontal"
                                />
                            ))}
                        </Div>
                    )}
                    <Div className="min-h-0">
                        <MoleculeBlogCard
                            key={featured.id}
                            blog={featured}
                            href={Routes.Blogs.post(featured.slug)}
                            variant="featured"
                        />
                    </Div>
                </Div>

                <Div className="mt-10 flex justify-center">
                    <Link
                        id="explore-all-blogs"
                        href="/blog"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-8 font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                            View all articles
                        </Label>
                        <Icon name={IconComponentsEnum.arrowRight} size="w-5 h-5" color="text-gray-700" />
                    </Link>
                </Div>
            </>
        );
    }

    return (
        <Div role="region" aria-labelledby="recent-blogs-heading" className="bg-gray-50 py-16 sm:py-20">
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Div className="mx-auto max-w-2xl text-center">
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-success-600"
                        className="mb-3 block font-semibold uppercase tracking-wide"
                    >
                        Blog
                    </Label>
                    <Div id="recent-blogs-heading" className="mb-4">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className="block font-bold">
                            Our recent blogs
                        </Label>
                    </Div>
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500" className="block">
                        Ideas, product updates, and stories from the team.
                    </Label>
                </Div>

                {section}
            </Div>
        </Div>
    );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Div, Label, Spinner } from '@/components/Atoms';
import MoleculeBlogCard from '@/components/Molecules/MoleculeBlogCard/MoleculeBlogCard';
import { EVariantLabel } from '@/Enum/Enum';
import { fetchPublicBlogs } from '@/lib/blog-api';
import { Routes } from '@/lib/routes';

export default function BlogIndexPage() {
    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['public-blogs-index'],
        queryFn: () => fetchPublicBlogs(50),
        staleTime: 60_000,
    });

    return (
        <Div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Label variant={EVariantLabel.h2} color="text-gray-900" className="mb-2 block font-bold">
                Blog
            </Label>
            <Label variant={EVariantLabel.bodyLarge} color="text-gray-500" className="mb-10 block">
                Tous les articles
            </Label>

            {isLoading ? (
                <Div className="flex justify-center py-24">
                    <Spinner color="text-primary-500" size="w-10 h-10" />
                </Div>
            ) : blogs.length === 0 ? (
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    Aucun article pour le moment.
                </Label>
            ) : (
                <Div className="grid gap-6 md:grid-cols-2">
                    {blogs.map((b) => (
                        <MoleculeBlogCard key={b.id} blog={b} href={Routes.Blogs.post(b.slug)} variant="horizontal" />
                    ))}
                </Div>
            )}
        </Div>
    );
}

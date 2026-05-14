'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Div, Label, Spinner, AtomBadge, Icon } from '@/components/Atoms';
import { Link } from '@/i18n/navigation';
import { EBadgeColor, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getBlogImageUrl, fetchPublicBlogBySlug } from '@/lib/blog-api';

const TAG_STYLES: { color: EBadgeColor }[] = [
    { color: EBadgeColor.danger },
    { color: EBadgeColor.primary },
    { color: EBadgeColor.success },
    { color: EBadgeColor.warning },
];

function formatBlogDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

export default function BlogArticlePage() {
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : '';

    const { data: blog, isLoading, isError, error } = useQuery({
        queryKey: ['public-blog', slug],
        queryFn: () => fetchPublicBlogBySlug(slug),
        enabled: !!slug,
    });

    return (
        <Div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
                <Icon name={IconComponentsEnum.arrowLeft} size="w-4 h-4" color="text-primary-600" />
                <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="font-medium">
                    Retour au blog
                </Label>
            </Link>

            {isLoading && (
                <Div className="flex justify-center py-20">
                    <Spinner color="text-primary-500" size="w-10 h-10" />
                </Div>
            )}

            {isError && (
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-600">
                    {error instanceof Error ? error.message : 'Article introuvable.'}
                </Label>
            )}

            {blog && !isLoading && (
                <article>
                    <Label variant={EVariantLabel.bodySmall} color="text-success-600" className="mb-3 block font-medium">
                        {formatBlogDate(blog.publishedAt)}
                    </Label>
                    <Label variant={EVariantLabel.h2} color="text-gray-900" className="mb-6 block font-bold">
                        {blog.title}
                    </Label>

                    {(blog.tags?.length ?? 0) > 0 && (
                        <Div className="mb-6 flex flex-wrap gap-2">
                            {(blog.tags ?? []).map((tag, i) => (
                                <AtomBadge
                                    key={`${tag}-${i}`}
                                    text={tag}
                                    color={TAG_STYLES[i % TAG_STYLES.length]!.color}
                                    size="small"
                                />
                            ))}
                        </Div>
                    )}

                    {getBlogImageUrl(blog.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={getBlogImageUrl(blog.imageUrl)}
                            alt=""
                            className="mb-8 w-full max-h-[420px] rounded-2xl object-cover"
                        />
                    ) : null}

                    {(blog.excerpt ?? '').trim() ? (
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-600" className="mb-6 block leading-relaxed">
                            {blog.excerpt}
                        </Label>
                    ) : null}

                    {(blog.content ?? '').trim() ? (
                        <Div className="prose prose-neutral max-w-none">
                            <Label variant={EVariantLabel.bodyLarge} color="text-gray-800" className="block whitespace-pre-wrap leading-relaxed">
                                {blog.content}
                            </Label>
                        </Div>
                    ) : null}
                </article>
            )}
        </Div>
    );
}

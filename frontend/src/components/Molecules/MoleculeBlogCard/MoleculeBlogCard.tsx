'use client';

import { Link } from '@/i18n/navigation';
import { Div, Icon, Label, AtomBadge } from '@/components/Atoms';
import { EBadgeColor, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getBlogImageUrl } from '@/lib/blog-api';
import type { IMoleculeBlogCard } from '@/interfaces/Molecules/IMoleculeBlogCard/IMoleculeBlogCard';

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
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

export default function MoleculeBlogCard({ blog, href, variant = 'horizontal' }: IMoleculeBlogCard) {
    const imageSrc = getBlogImageUrl(blog.imageUrl ?? null);
    const excerpt = (blog.excerpt ?? '').trim() || '';
    const isFeatured = variant === 'featured';

    const body = (
        <>
            <Label
                variant={EVariantLabel.bodySmall}
                color="text-success-600"
                className={`mb-2 block font-medium ${isFeatured ? '' : ''}`}
            >
                {formatBlogDate(blog.publishedAt) || '—'}
            </Label>
            <Div className={`flex items-start gap-1 ${isFeatured ? 'mb-3' : 'mb-2'}`}>
                <Link href={href} className="group flex-1 min-w-0">
                    <Label
                        variant={isFeatured ? EVariantLabel.h4 : EVariantLabel.h6}
                        color="text-gray-900"
                        className="block font-bold group-hover:text-primary-600 transition-colors line-clamp-2"
                    >
                        {blog.title}
                    </Label>
                </Link>
                <Link href={href} className="group/icon shrink-0 p-1 text-gray-400 hover:text-primary-600 transition-colors" aria-label="">
                    <Icon
                        name={IconComponentsEnum.arrowRight}
                        size="w-5 h-5"
                        color="text-gray-400"
                        className="transition-transform group-hover/icon:translate-x-0.5 group-hover/icon:-translate-y-0.5"
                    />
                </Link>
            </Div>
            <Label
                variant={EVariantLabel.bodySmall}
                color="text-gray-500"
                className={`block ${isFeatured ? 'line-clamp-4 mb-4' : 'line-clamp-2 mb-3'}`}
            >
                {excerpt}
            </Label>
            {(blog.tags?.length ?? 0) > 0 && (
                <Div className="flex flex-wrap gap-2">
                    {(blog.tags ?? []).slice(0, isFeatured ? 6 : 3).map((tag, i) => (
                        <AtomBadge
                            key={`${tag}-${i}`}
                            text={tag}
                            color={TAG_STYLES[i % TAG_STYLES.length]!.color}
                            size="small"
                        />
                    ))}
                </Div>
            )}
        </>
    );

    if (isFeatured) {
        return (
            <Div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                <Link href={href} className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-gray-100">
                    {imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageSrc} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    ) : (
                        <Div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100">
                            <Icon name={IconComponentsEnum.bookOpenText} size="w-16 h-16" color="text-primary-400" />
                        </Div>
                    )}
                </Link>
                <Div className="flex flex-1 flex-col p-6">{body}</Div>
            </Div>
        );
    }

    return (
        <Div className="flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-5">
            <Link href={href} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-32 sm:w-32">
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                ) : (
                    <Div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100">
                        <Icon name={IconComponentsEnum.bookOpenText} size="w-10 h-10" color="text-primary-400" />
                    </Div>
                )}
            </Link>
            <Div className="min-w-0 flex-1 py-1">{body}</Div>
        </Div>
    );
}

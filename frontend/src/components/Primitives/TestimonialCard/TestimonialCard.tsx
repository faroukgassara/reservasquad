'use client';

import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import StarRating from '@/components/Primitives/StarRating/StarRating';
import { EVariantLabel } from '@/Enum/Enum';
import type { TestimonialRecord } from '@/lib/testimonial-api';
import { twMerge } from 'tailwind-merge';

interface ITestimonialCard {
    testimonial: Pick<TestimonialRecord, 'firstName' | 'lastName' | 'title' | 'description' | 'rating'>;
    compact?: boolean;
}

// Brand-constrained gradients: teal-family plus the gold accent
const AVATAR_GRADIENTS = [
    'from-primary-500 to-primary-700',
    'from-primary-300 to-primary-500',
    'from-gold-500 to-gold-700',
    'from-primary-700 to-primary-900',
    'from-primary-400 to-primary-600',
    'from-gray-500 to-gray-700',
] as const;

function getInitials(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    return `${first}${last}`.toUpperCase() || '?';
}

function getAvatarGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function TestimonialCard({ testimonial, compact = false }: Readonly<ITestimonialCard>) {
    const fullName = `${testimonial.firstName} ${testimonial.lastName}`.trim();
    const initials = getInitials(testimonial.firstName, testimonial.lastName);
    const avatarGradient = getAvatarGradient(fullName);

    return (
        <article
            className={twMerge(
                'relative flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md',
                compact ? 'h-full p-4 sm:p-5' : 'h-full p-6 hover:shadow-lg',
            )}
        >
            <span
                className="pointer-events-none absolute right-3 top-2 select-none font-serif text-5xl leading-none text-primary-100 sm:right-4 sm:top-3 sm:text-6xl"
                aria-hidden="true"
            >
                &ldquo;
            </span>

            <StarRating
                value={testimonial.rating}
                readonly
                size="sm"
                className={compact ? 'relative mb-3' : 'relative mb-4'}
            />

            <blockquote className={twMerge('relative flex-1', compact ? 'mb-4' : 'mb-6')}>
                <Label
                    variant={compact ? EVariantLabel.bodySmall : EVariantLabel.body}
                    color="text-gray-700"
                    className={twMerge(
                        'leading-relaxed',
                        compact && 'line-clamp-4 text-sm sm:text-[0.9375rem]',
                    )}
                >
                    {testimonial.description}
                </Label>
            </blockquote>

            <footer className={twMerge('mt-auto flex items-center gap-3 border-t border-gray-100', compact ? 'pt-3' : 'pt-4')}>
                <Div
                    className={twMerge(
                        'flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white shadow-sm',
                        avatarGradient,
                        compact ? 'size-9 text-xs' : 'size-11 text-sm',
                    )}
                    aria-hidden="true"
                >
                    {initials}
                </Div>
                <Div className="min-w-0 flex-1">
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-900"
                        className={twMerge('block truncate font-semibold', compact && 'text-sm')}
                    >
                        {fullName}
                    </Label>
                    <Label variant={EVariantLabel.hint} color="text-gray-500" className="mt-0.5 block truncate">
                        {testimonial.title}
                    </Label>
                </Div>
            </footer>
        </article>
    );
}

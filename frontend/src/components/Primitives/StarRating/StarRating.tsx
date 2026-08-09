'use client';

import { twMerge } from 'tailwind-merge';

interface IStarRating {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export default function StarRating({
    value,
    onChange,
    readonly = false,
    size = 'md',
    className,
}: Readonly<IStarRating>) {
    const starSize = size === 'sm' ? 'text-base' : 'text-xl';

    return (
        <div
            className={twMerge('inline-flex items-center gap-0.5', className)}
            role={readonly ? 'img' : 'group'}
            aria-label={readonly ? `${value} sur 5 étoiles` : 'Choisir une note'}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                if (readonly) {
                    return (
                        <span
                            key={star}
                            className={twMerge(starSize, filled ? 'text-accent-600' : 'text-gray-200')}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    );
                }
                return (
                    <button
                        key={star}
                        type="button"
                        className={twMerge(
                            starSize,
                            'leading-none transition-colors hover:scale-110',
                            filled ? 'text-accent-600' : 'text-gray-300 hover:text-accent-500',
                        )}
                        onClick={() => onChange?.(star)}
                        aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

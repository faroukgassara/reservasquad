'use client';

import { useEffect, useState } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { PublicFaqItem } from '@/lib/faq-api';
import { twMerge } from 'tailwind-merge';

interface IFaqAccordion {
    items: PublicFaqItem[];
    className?: string;
    toggleStyle?: 'chevron' | 'plus';
    compact?: boolean;
}

export default function FaqAccordion({
    items,
    className,
    toggleStyle = 'chevron',
    compact = false,
}: Readonly<IFaqAccordion>) {
    const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

    useEffect(() => {
        setOpenId(items[0]?.id ?? null);
    }, [items]);

    if (items.length === 0) {
        return (
            <Div className={twMerge('rounded-xl border border-gray-200 bg-white p-8 text-center', className)}>
                <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                    Aucune question disponible pour le moment.
                </Label>
            </Div>
        );
    }

    return (
        <Div className={twMerge('flex flex-col', toggleStyle === 'plus' ? '' : 'gap-3', className)}>
            {items.map((item) => {
                const isOpen = openId === item.id;
                return (
                    <Div
                        key={item.id}
                        className={twMerge(
                            toggleStyle === 'plus'
                                ? 'border-b border-gray-100 last:border-b-0'
                                : 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
                        )}
                    >
                        <button
                            type="button"
                            className={twMerge(
                                'flex w-full items-center justify-between gap-4 text-left transition-colors',
                                toggleStyle === 'plus'
                                    ? compact ? 'py-2.5' : 'py-5'
                                    : compact ? 'px-3 py-2.5 hover:bg-gray-50' : 'px-5 py-4 hover:bg-gray-50',
                            )}
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                            aria-expanded={isOpen}
                        >
                            <Label
                                variant={compact ? EVariantLabel.bodySmall : EVariantLabel.bodyLarge}
                                color="text-gray-900"
                                className="line-clamp-2"
                            >
                                {item.question}
                            </Label>
                            {toggleStyle === 'plus' ? (
                                <Label
                                    variant={EVariantLabel.bodyLarge}
                                    color="text-gray-400"
                                    className="shrink-0"
                                >
                                    {isOpen ? '−' : '+'}
                                </Label>
                            ) : (
                                <Icon
                                    name={isOpen ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                                    color="text-primary-500"
                                    size={ESize.lg}
                                    className="shrink-0"
                                />
                            )}
                        </button>
                        {isOpen && (
                            <Div className={twMerge(toggleStyle === 'plus' ? (compact ? 'pb-2.5 pr-4' : 'pb-5 pr-8') : 'border-t border-gray-100 px-5 py-4')}>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-500"
                                    className={twMerge('leading-snug whitespace-pre-wrap', compact && 'line-clamp-3')}
                                >
                                    {item.answer}
                                </Label>
                            </Div>
                        )}
                    </Div>
                );
            })}
        </Div>
    );
}

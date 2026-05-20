'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { twMerge } from 'tailwind-merge';
import AtomDiv from '../AtomDiv/AtomDiv';

type AtomLanguageSwitcherProps = Readonly<{
    compact?: boolean;
    className?: string;
}>;

const LANGUAGES = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'fr', label: 'FR', name: 'Français' },
] as const;

export default function AtomLanguageSwitcher({ compact = false, className }: AtomLanguageSwitcherProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const pillLayoutId = useId();

    return (
        <AtomDiv
            role="group"
            aria-label="Language"
            className={twMerge(compact ? 'flex justify-center' : 'w-full', className)}
        >
            <AtomDiv
                className={twMerge(
                    'inline-flex gap-0.5 p-0.5',
                    compact ?
                        'flex-col rounded-xl bg-primary-800/90 ring-1 ring-inset ring-primary-700/80'
                    :   'w-full rounded-full bg-slate-100/90 ring-1 ring-inset ring-slate-200/70',
                )}
            >
                {LANGUAGES.map((lang) => {
                    const isActive = locale === lang.code;

                    return (
                        <Link
                            key={lang.code}
                            href={pathname}
                            locale={lang.code}
                            title={lang.name}
                            aria-current={isActive ? 'true' : undefined}
                            className={twMerge(
                                'relative flex items-center justify-center rounded-full font-semibold transition-colors duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1',
                                compact ? 'size-9 text-xs' : 'min-w-0 flex-1 px-4 py-2 text-sm',
                                isActive ?
                                    compact ? 'text-primary-900'
                                    :   'text-primary-700'
                                : compact ? 'text-primary-200 hover:text-white'
                                :   'text-slate-500 hover:text-slate-800',
                            )}
                        >
                            {isActive ?
                                <motion.span
                                    layoutId={pillLayoutId}
                                    className={twMerge(
                                        'absolute inset-0 rounded-full shadow-sm',
                                        compact ?
                                            'bg-white ring-1 ring-white/20'
                                        :   'bg-white ring-1 ring-slate-200/50',
                                    )}
                                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                    aria-hidden
                                />
                            :   null}
                            <span className="relative z-10 tracking-wide">{lang.label}</span>
                        </Link>
                    );
                })}
            </AtomDiv>
        </AtomDiv>
    );
}

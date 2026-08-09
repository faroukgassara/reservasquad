'use client';

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';
import Icon from '../Icon/Icon';

type LocaleCode = (typeof routing.locales)[number];

interface LanguageOption {
    code: LocaleCode;
    name: string;
    shortCode: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'fr', name: 'Français', shortCode: 'FR' },
    { code: 'ar', name: 'العربية', shortCode: 'AR' },
    { code: 'en', name: 'English', shortCode: 'EN' },
];

function FlagIcon({ code, className }: Readonly<{ code: LocaleCode; className?: string }>) {
    const baseClass = twMerge('h-4 w-6 shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-black/5', className);

    if (code === 'fr') {
        return (
            <svg viewBox="0 0 24 16" className={baseClass} aria-hidden="true">
                <rect width="8" height="16" fill="#002395" />
                <rect x="8" width="8" height="16" fill="#FFFFFF" />
                <rect x="16" width="8" height="16" fill="#ED2939" />
            </svg>
        );
    }

    if (code === 'en') {
        return (
            <svg viewBox="0 0 24 16" className={baseClass} aria-hidden="true">
                <rect width="24" height="16" fill="#012169" />
                <path d="M0 0 L24 16 M24 0 L0 16" stroke="#FFFFFF" strokeWidth="2.5" />
                <path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" strokeWidth="1.2" />
                <path d="M12 0 V16 M0 8 H24" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M12 0 V16 M0 8 H24" stroke="#C8102E" strokeWidth="2.2" />
            </svg>
        );
    }

    // Tunisia flag — used for Arabic locale in this project
    return (
        <svg viewBox="0 0 24 16" className={baseClass} aria-hidden="true">
            <rect width="24" height="16" fill="#E70013" />
            <circle cx="11" cy="8" r="4.5" fill="#FFFFFF" />
            <circle cx="12.2" cy="8" r="3.6" fill="#E70013" />
            <path
                d="M15.2 8 L16.8 8.55 L16.1 7.15 L16.1 8.85 L16.8 7.45 Z"
                fill="#E70013"
            />
        </svg>
    );
}

function CheckIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <svg viewBox="0 0 16 16" className={twMerge('h-4 w-4 shrink-0', className)} aria-hidden="true">
            <path
                d="M3 8.5 L6.5 12 L13 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface LanguageSwitcherProps {
    /** Opens the menu above (`bottom`) or below (`top`) the trigger — use `top` in headers. */
    menuPlacement?: 'top' | 'bottom';
    className?: string;
}

export default function LanguageSwitcher({
    menuPlacement = 'bottom',
    className,
}: Readonly<LanguageSwitcherProps> = {}) {
    const locale = useLocale();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0];

    const closeDropdown = useCallback(() => setOpen(false), []);

    // Close when clicking outside the switcher or pressing Escape
    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeDropdown();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, closeDropdown]);

    const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
        }
    };

    return (
        <div
            ref={containerRef}
            className={twMerge('relative inline-block max-w-full text-start', className ?? 'w-full')}
        >
            <button
                type="button"
                id="language-switcher-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Language: ${currentLanguage.name}. Change language`}
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={handleTriggerKeyDown}
                className={twMerge(
                    'inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200',
                    className?.includes('w-auto') ? 'w-auto' : 'w-full',
                    'hover:border-primary-200 hover:bg-gray-50 hover:shadow-md',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1',
                    open && 'border-primary-300 bg-gray-50 shadow-md',
                )}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <FlagIcon code={currentLanguage.code} />
                    <span className="truncate font-semibold uppercase tracking-wide text-gray-900">
                        {currentLanguage.shortCode}
                    </span>
                    <span className="hidden truncate text-gray-600 md:inline">{currentLanguage.name}</span>
                </span>
                <Icon
                    name={IconComponentsEnum.chevronDown}
                    size="w-4 h-4"
                    color="text-gray-500"
                    className={twMerge('shrink-0 transition-transform duration-200', open && 'rotate-180')}
                />
            </button>

            <div
                role="listbox"
                aria-label="Select language"
                className={twMerge(
                    'absolute start-0 z-50 min-w-[220px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg',
                    'transition-all duration-200 ease-out',
                    menuPlacement === 'top'
                        ? 'top-full mt-2 w-full origin-top-start'
                        : 'bottom-full mb-2 w-full origin-bottom-start',
                    open
                        ? 'pointer-events-auto scale-100 opacity-100'
                        : 'pointer-events-none scale-95 opacity-0',
                )}
            >
                {LANGUAGES.map((language) => {
                    const isActive = language.code === locale;

                    return (
                        <Link
                            key={language.code}
                            href={pathname}
                            locale={language.code}
                            role="option"
                            aria-current={isActive ? 'true' : undefined}
                            onClick={closeDropdown}
                            className={twMerge(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                                'focus:outline-none focus-visible:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-500/30',
                            )}
                        >
                            <FlagIcon code={language.code} />
                            <span className="min-w-0 flex-1 truncate font-medium">{language.name}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                {language.shortCode}
                            </span>
                            {isActive && <CheckIcon className="text-primary-600" />}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

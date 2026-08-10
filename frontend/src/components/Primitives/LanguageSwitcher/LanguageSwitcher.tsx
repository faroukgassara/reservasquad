'use client';

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';
import Icon from '../Icon/Icon';

type LocaleCode = (typeof routing.locales)[number];

interface LanguageOption {
    code: LocaleCode;
    name: string;
    shortCode: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', shortCode: 'EN' },
    { code: 'fr', name: 'Français', shortCode: 'FR' },
    { code: 'ar', name: 'العربية', shortCode: 'AR' },
];

const FLAG_ICONS: Record<LocaleCode, IconComponentsEnum> = {
    en: IconComponentsEnum.flagEn,
    fr: IconComponentsEnum.flagFr,
    ar: IconComponentsEnum.flagAr,
};

function FlagIcon({ code, className }: Readonly<{ code: LocaleCode; className?: string }>) {
    return (
        <Icon
            name={FLAG_ICONS[code]}
            size={ESize.xs}
            color="text-gray-900"
            className={twMerge(
                'h-4 w-6 overflow-hidden rounded-sm shadow-sm ring-1 ring-black/5',
                className,
            )}
        />
    );
}

interface ILanguageSwitcher {
    /** Opens the menu above (`bottom`) or below (`top`) the trigger — use `top` in headers. */
    menuPlacement?: 'top' | 'bottom';
    /** Icon-only circular trigger for collapsed sidebar. */
    compact?: boolean;
    className?: string;
}

interface MenuPosition {
    top?: number;
    bottom?: number;
    left: number;
    width: number;
}

export default function LanguageSwitcher({
    menuPlacement = 'bottom',
    compact = false,
    className,
}: Readonly<ILanguageSwitcher> = {}) {
    const locale = useLocale();
    const t = useTranslations('common');
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0];

    const closeDropdown = useCallback(() => setOpen(false), []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateMenuPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const menuWidth = Math.max(compact ? 200 : rect.width, 220);
        const gap = 8;
        const viewportPadding = 8;

        let left = compact ? rect.right + gap : rect.left;
        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left = compact
                ? Math.max(viewportPadding, rect.left - menuWidth - gap)
                : Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding);
        }

        if (menuPlacement === 'top') {
            setMenuPosition({ top: rect.bottom + gap, left, width: menuWidth });
            return;
        }

        // Open above the trigger; `bottom` keeps the menu anchored without needing its height.
        setMenuPosition({
            bottom: window.innerHeight - rect.top + gap,
            left,
            width: menuWidth,
        });
    }, [compact, menuPlacement]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuPosition(null);
            return;
        }

        updateMenuPosition();
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [open, updateMenuPosition]);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }
            closeDropdown();
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

    const menu = open && mounted && menuPosition
        ? createPortal(
            <div
                ref={menuRef}
                role="listbox"
                aria-label={t('selectLanguage')}
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    bottom: menuPosition.bottom,
                    left: menuPosition.left,
                    width: menuPosition.width,
                    zIndex: 100,
                }}
                className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
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
                            {isActive && (
                                <Icon
                                    name={IconComponentsEnum.check}
                                    size={ESize.xs}
                                    color="text-primary-600"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>,
            document.body,
        )
        : null;

    return (
        <div
            ref={containerRef}
            className={twMerge(
                'relative text-start',
                compact ? 'inline-flex' : 'inline-block max-w-full',
                className ?? (compact ? undefined : 'w-full'),
            )}
        >
            <button
                ref={triggerRef}
                type="button"
                id="language-switcher-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Language: ${currentLanguage.name}. Change language`}
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={handleTriggerKeyDown}
                className={twMerge(
                    compact
                        ? twMerge(
                            'flex size-12 items-center justify-center rounded-full border border-primary-700 bg-primary-800 text-primary-100 shadow-none transition-all duration-200',
                            'hover:border-primary-600 hover:bg-primary-700',
                            'focus:outline-none focus:ring-2 focus:ring-primary-300/40 focus:ring-offset-0',
                            open && 'border-primary-500 bg-primary-700',
                        )
                        : twMerge(
                            'inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200',
                            className?.includes('w-auto') ? 'w-auto' : 'w-full',
                            'hover:border-primary-200 hover:bg-gray-50 hover:shadow-md',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1',
                            open && 'border-primary-300 bg-gray-50 shadow-md',
                        ),
                )}
            >
                {compact ? (
                    <FlagIcon code={currentLanguage.code} className="h-3.5 w-5" />
                ) : (
                    <>
                        <span className="flex min-w-0 items-center gap-2">
                            <FlagIcon code={currentLanguage.code} />
                            <span className="truncate font-semibold uppercase tracking-wide text-gray-900">
                                {currentLanguage.shortCode}
                            </span>
                            <span className="hidden truncate text-gray-600 md:inline">{currentLanguage.name}</span>
                        </span>
                        <Icon
                            name={IconComponentsEnum.chevronDown}
                            size={ESize.sm}
                            color="text-gray-500"
                            className={twMerge('shrink-0 transition-transform duration-200', open && 'rotate-180')}
                        />
                    </>
                )}
            </button>

            {menu}
        </div>
    );
}

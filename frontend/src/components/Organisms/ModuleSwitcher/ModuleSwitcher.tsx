'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Tooltip from '@/components/Primitives/Tooltip/Tooltip';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { INavModule, ModuleTone } from '@/lib/navigation';
import { Routes } from '@/lib/routes';
import type { ELabelColor } from '@/theme/labelColors';

interface IModuleSwitcher {
    current: INavModule;
    modules: INavModule[];
}

// Same tones as the launcher cards, at shades that stay legible in both themes.
const TONE_ICON: Record<ModuleTone, ELabelColor> = {
    primary: 'text-primary-500',
    accent: 'text-accent-500',
    success: 'text-success-600',
    warning: 'text-warning-600',
};

const ModuleSwitcher = ({ current, modules }: IModuleSwitcher) => {
    const t = useTranslations('sidebar');
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    if (modules.length <= 1) return null;

    return (
        <>
            {/* Laptop and up: every module is one click away. */}
            <nav
                aria-label={t('switchModule')}
                className="hidden shrink-0 items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-25 p-1 laptop:flex"
            >
                {modules.map((module) => {
                    const active = module.id === current.id;
                    const name = t(`modules.${module.id}`);
                    return (
                        <Tooltip key={module.id} content={name} placement="bottom" disabled={active}>
                            <Link
                                id={`module-switch-${module.id}`}
                                href={module.homeHref}
                                aria-label={name}
                                aria-current={active ? 'page' : undefined}
                                className={twMerge(
                                    'flex h-8 min-w-8 items-center justify-center gap-2 rounded-lg px-2 transition-colors',
                                    active ? 'bg-white shadow-sm' : 'hover:bg-gray-100',
                                )}
                            >
                                <Icon
                                    name={module.icon}
                                    size={ESize.sm}
                                    color={active ? TONE_ICON[module.tone] : 'text-gray-500'}
                                />
                                {active ? (
                                    <span aria-hidden="true" className="hidden lg:inline">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="cursor-pointer font-semibold!">
                                            {name}
                                        </Label>
                                    </span>
                                ) : null}
                            </Link>
                        </Tooltip>
                    );
                })}
            </nav>

            {/* Below laptop: compact dropdown listing every module, current one marked. */}
            <div ref={menuRef} className="relative shrink-0 laptop:hidden">
                <button
                    id="module-switcher"
                    type="button"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label={t('switchModule')}
                    onClick={() => setMenuOpen((value) => !value)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-25 px-2 py-1.5 transition-colors hover:bg-gray-100 sm:gap-2 sm:px-2.5"
                >
                    <Icon name={current.icon} size={ESize.sm} color={TONE_ICON[current.tone]} />
                    <span aria-hidden="true" className="hidden sm:inline">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="cursor-pointer font-semibold!">
                            {t(`modules.${current.id}`)}
                        </Label>
                    </span>
                    <Icon
                        name={menuOpen ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                        size={ESize.sm}
                        color="text-gray-500"
                        className="size-3.5 sm:size-4"
                    />
                </button>

                {menuOpen ? (
                    <Div className="absolute start-0 top-full z-50 mt-1.5 flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-0.5 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
                        {modules.map((module) => {
                            const active = module.id === current.id;
                            return (
                                <Link
                                    key={module.id}
                                    href={module.homeHref}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setMenuOpen(false)}
                                    className={twMerge(
                                        'flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-100',
                                        active && 'bg-gray-50',
                                    )}
                                >
                                    <Icon name={module.icon} size={ESize.sm} color={TONE_ICON[module.tone]} />
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-900"
                                        className={twMerge('flex-1 cursor-pointer truncate', active && 'font-semibold!')}
                                    >
                                        {t(`modules.${module.id}`)}
                                    </Label>
                                    {active ? <Icon name={IconComponentsEnum.check} size={ESize.sm} color="text-gray-500" /> : null}
                                </Link>
                            );
                        })}
                        <Link
                            href={Routes.Launcher}
                            onClick={() => setMenuOpen(false)}
                            className="mt-1 flex min-h-11 items-center gap-3 rounded-lg border-t border-gray-100 px-2.5 py-2 pt-2.5 transition-colors hover:bg-gray-100"
                        >
                            <Icon name={IconComponentsEnum.home} size={ESize.sm} color="text-gray-500" />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="cursor-pointer truncate">
                                {t('allModules')}
                            </Label>
                        </Link>
                    </Div>
                ) : null}
            </div>
        </>
    );
};

export default ModuleSwitcher;

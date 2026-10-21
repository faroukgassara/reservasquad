'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { Link, usePathname } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { useSidebar } from '@/hooks/useSidebar';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { INavModule } from '@/lib/navigation';
import { Routes } from '@/lib/routes';

interface IModuleSwitcher {
    current: INavModule;
    modules: INavModule[];
}

const ModuleSwitcher = ({ current, modules }: IModuleSwitcher) => {
    const t = useTranslations('sidebar');
    const { open: isExpanded, isMobile, setOpen } = useSidebar();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(false), [pathname, isExpanded]);

    const closeMobileSidebar = () => {
        if (isMobile) setOpen(false);
    };

    if (!isExpanded) {
        return (
            <Link
                id="module-switcher-collapsed"
                href={Routes.Launcher}
                title={t('allModules')}
                aria-label={t('allModules')}
                className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-800 transition-colors hover:bg-primary-700"
            >
                <Icon name={current.icon} size={ESize.md} color="text-primary-100" />
            </Link>
        );
    }

    const otherModules = modules.filter((module) => module.id !== current.id);

    return (
        <Div className="flex flex-col gap-1">
            <button
                id="module-switcher"
                type="button"
                aria-expanded={menuOpen}
                aria-label={t('switchModule')}
                onClick={() => setMenuOpen((value) => !value)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-25 px-3 py-2.5 text-start transition-colors hover:bg-gray-100"
            >
                <Div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <Icon name={current.icon} size={ESize.sm} color="text-primary-600" />
                </Div>
                <Div className="flex min-w-0 flex-1 flex-col">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="cursor-pointer">
                        {t('module')}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="cursor-pointer truncate font-semibold">
                        {t(`modules.${current.id}`)}
                    </Label>
                </Div>
                <Icon
                    name={menuOpen ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                    size={ESize.sm}
                    color="text-gray-500"
                />
            </button>

            {menuOpen ? (
                <Div className="flex flex-col gap-0.5 rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
                    {otherModules.map((module) => (
                        <Link
                            key={module.id}
                            href={module.homeHref}
                            onClick={closeMobileSidebar}
                            className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-100"
                        >
                            <Icon name={module.icon} size={ESize.sm} color="text-primary-500" />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="cursor-pointer truncate">
                                {t(`modules.${module.id}`)}
                            </Label>
                        </Link>
                    ))}
                    <Link
                        href={Routes.Launcher}
                        onClick={closeMobileSidebar}
                        className={twMerge(
                            'flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-100',
                            otherModules.length > 0 && 'mt-1 border-t border-gray-100 pt-2.5',
                        )}
                    >
                        <Icon name={IconComponentsEnum.squaresFour} size={ESize.sm} color="text-primary-500" />
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-800" className="cursor-pointer truncate font-medium">
                            {t('allModules')}
                        </Label>
                    </Link>
                </Div>
            ) : null}
        </Div>
    );
};

export default ModuleSwitcher;

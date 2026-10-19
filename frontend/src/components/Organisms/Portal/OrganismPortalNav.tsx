'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { Link, usePathname } from '@/i18n/navigation';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

export default function OrganismPortalNav() {
    const t = useTranslations('portal');
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const pathname = usePathname();
    const { data: session } = useSession();
    const userName = [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ');

    const links = [
        { href: Routes.Portal.index, label: t('nav.overview'), exact: true },
        { href: Routes.Portal.book, label: t('nav.book') },
        { href: Routes.Portal.history, label: t('nav.history') },
    ];

    const isActive = (link: (typeof links)[number]) =>
        link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);

    return (
        <header className="flex shrink-0 flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 tablet:flex-row tablet:items-center tablet:gap-6">
            <Div className="flex items-center justify-between gap-4">
                <Link href={Routes.Portal.index} className="flex shrink-0 items-center">
                    <BrandLogo alt={tCommon('brandLogoAlt')} height={28} className="w-auto object-contain" priority />
                </Link>
                <Div className="flex items-center gap-2 tablet:hidden">
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                    <Button
                        id="portal-logout-mobile"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="only"
                        icon={{ name: IconComponentsEnum.logOut, size: ESize.sm, color: 'text-primary-600' }}
                        onClick={() => signOut()}
                        aria-label={tAuth('logout')}
                    />
                </Div>
            </Div>

            <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto">
                {links.map((link) => {
                    const active = isActive(link);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={active ? 'page' : undefined}
                            className={twMerge(
                                'flex min-h-11 shrink-0 items-center rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 sm:min-h-0',
                                active && 'bg-primary-50 hover:bg-primary-50',
                            )}
                        >
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color={active ? 'text-primary-600' : 'text-gray-600'}
                                className="font-medium"
                            >
                                {link.label}
                            </Label>
                        </Link>
                    );
                })}
            </nav>

            <Div className="hidden items-center gap-3 tablet:flex">
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
                {userName ? (
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="max-w-40 truncate">
                        {userName}
                    </Label>
                ) : null}
                <Button
                    id="portal-logout"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.logOut, size: ESize.sm, color: 'text-primary-600' }}
                    text={tAuth('logout')}
                    onClick={() => signOut()}
                />
            </Div>
        </header>
    );
}

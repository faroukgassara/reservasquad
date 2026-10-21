'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { Link, usePathname } from '@/i18n/navigation';
import Avatar from '@/components/Primitives/Avatar/Avatar';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import NotificationBell from '@/components/Organisms/Notifications/NotificationBell';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

export interface IAppTopBarLink {
    href: string;
    label: string;
    exact?: boolean;
}

interface IOrganismAppTopBar {
    homeHref: string;
    links?: IAppTopBarLink[];
    showNotifications?: boolean;
}

export default function OrganismAppTopBar({ homeHref, links = [], showNotifications = false }: Readonly<IOrganismAppTopBar>) {
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const pathname = usePathname();
    const { data: session } = useSession();
    const userName =
        [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') || tCommon('userFallback');

    const isActive = (link: IAppTopBarLink) =>
        link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);

    const renderLinks = (className: string) => (
        <nav className={className}>
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
                            className="cursor-pointer font-medium"
                        >
                            {link.label}
                        </Label>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <Div className="flex items-center gap-4 tablet:gap-6">
                <Link href={homeHref} className="flex shrink-0 items-center">
                    <BrandLogo alt={tCommon('brandLogoAlt')} height={28} className="w-auto object-contain" priority />
                </Link>

                {links.length > 0 ? renderLinks('hidden min-w-0 flex-1 items-center gap-1 tablet:flex') : null}

                <Div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
                    {showNotifications ? <NotificationBell /> : null}
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                    <Div className="hidden laptop:block">
                        <Avatar
                            id="top-bar-avatar"
                            name={userName}
                            email={session?.user?.email ?? undefined}
                            size={ESize.md}
                            className="min-w-0"
                        />
                    </Div>
                    <Button
                        id="top-bar-logout"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="only"
                        icon={{ name: IconComponentsEnum.logOut, size: ESize.sm, color: 'text-primary-600' }}
                        onClick={() => signOut()}
                        aria-label={tAuth('logout')}
                    />
                </Div>
            </Div>

            {links.length > 0
                ? renderLinks('-mx-1 mt-2 flex items-center gap-1 overflow-x-auto tablet:hidden')
                : null}
        </header>
    );
}

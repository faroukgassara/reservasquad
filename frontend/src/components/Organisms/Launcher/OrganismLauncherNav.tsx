'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Avatar from '@/components/Primitives/Avatar/Avatar';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import NotificationBell from '@/components/Organisms/Notifications/NotificationBell';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

export default function OrganismLauncherNav() {
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const { data: session } = useSession();
    const userName =
        [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') || tCommon('userFallback');

    return (
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <Link href={Routes.Launcher} className="flex shrink-0 items-center">
                <BrandLogo alt={tCommon('brandLogoAlt')} height={28} className="w-auto object-contain" priority />
            </Link>

            <Div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
                <Div className="hidden sm:block">
                    <Avatar
                        id="launcher-avatar"
                        name={userName}
                        email={session?.user?.email ?? undefined}
                        size={ESize.md}
                        className="min-w-0"
                    />
                </Div>
                <Button
                    id="launcher-logout"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    iconPosition="only"
                    icon={{ name: IconComponentsEnum.logOut, size: ESize.sm, color: 'text-primary-600' }}
                    onClick={() => signOut()}
                    aria-label={tAuth('logout')}
                />
            </Div>
        </header>
    );
}

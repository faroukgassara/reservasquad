'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { usePathname } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { homePathForRole, Routes } from '@/lib/routes';

export default function OrganismPosNav() {
    const t = useTranslations('pos');
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const { data: session } = useSession();
    const links: { href: string; label: string; exact?: boolean; alsoActive?: string[] }[] = [
        { href: Routes.Pos.index, label: t('nav.dashboard'), exact: true },
        { href: Routes.Pos.sessions, label: t('nav.sessions') },
        { href: Routes.Pos.subscriptions, label: t('nav.subscriptions') },
        { href: Routes.Pos.sales, label: t('nav.billing'), alsoActive: [Routes.Pos.invoices] },
        { href: Routes.Pos.products, label: t('nav.products') },
        { href: Routes.Pos.categories, label: t('nav.categories') },
        { href: Routes.Pos.clients, label: t('nav.clients') },
    ];

    const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
    const isActive = (link: (typeof links)[number]) =>
        link.exact ? pathname === link.href : [link.href, ...(link.alsoActive ?? [])].some(matches);

    return (
        <header className="flex shrink-0 flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6">
            <Div className="flex items-center justify-between gap-4">
                <Link href={Routes.Pos.index} className="flex shrink-0 items-center">
                    <Image
                        src={BiblioSquadLogo}
                        alt={tCommon('brandLogoAlt')}
                        height={28}
                        className="w-auto object-contain"
                        priority
                    />
                </Link>
                <Div className="flex items-center gap-2 lg:hidden">
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                </Div>
            </Div>

            <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto">
                {links.map((link) => {
                    const active = isActive(link);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={twMerge(
                                'shrink-0 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100',
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

            <Div className="hidden items-center gap-3 lg:flex">
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
                <Link
                    href={homePathForRole(session?.user?.role)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50"
                >
                    <Icon name={IconComponentsEnum.arrowLeft} size={ESize.sm} color="text-gray-600" />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                        {t('backToApp')}
                    </Label>
                </Link>
            </Div>
            <Link
                href={homePathForRole(session?.user?.role)}
                className="flex items-center gap-2 self-start lg:hidden"
            >
                <Icon name={IconComponentsEnum.arrowLeft} size={ESize.sm} color="text-gray-600" />
                <Label variant={EVariantLabel.caption} color="text-gray-600">
                    {t('backToApp')}
                </Label>
            </Link>
        </header>
    );
}

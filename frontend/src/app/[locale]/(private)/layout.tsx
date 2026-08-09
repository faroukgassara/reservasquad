'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from '@/components/Primitives/Sidebar/Sidebar';
import { EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import { useAuthorization } from '@/hooks/useAuthorization';
import { MobileSidebarContext } from '@/contexts/MobileSidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Avatar from '@/components/Primitives/Avatar/Avatar';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';

export default function PrivateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const t = useTranslations('sidebar');
    const tCommon = useTranslations('common');
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isMobile = !isDesktop;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { data: session } = useSession();
    const userName = [session?.user?.firstName, session?.user?.lastName]
        .filter(Boolean)
        .join(' ') || tCommon('userFallback');
    const { isAllowed } = useAuthorization();

    useEffect(() => {
        setSidebarOpen(isDesktop);
    }, [isDesktop]);

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    const mobileSidebarValue = useMemo(
        () => ({
            isMobile,
            openSidebar,
            closeSidebar,
        }),
        [isMobile, openSidebar, closeSidebar],
    );

    const navigationItems = [
        {
            id: 'dashboard',
            iconName: IconComponentsEnum.home,
            label: t('dashboard'),
            href: Routes.Dashboard,
        },
        {
            id: 'calendar',
            iconName: IconComponentsEnum.calendar,
            label: t('calendar'),
            href: Routes.Calendar,
        },
        {
            id: 'reservations',
            iconName: IconComponentsEnum.bookOpenText,
            label: t('reservations'),
            href: Routes.Reservations.index,
        },
        {
            id: 'rooms',
            iconName: IconComponentsEnum.home,
            label: t('rooms'),
            href: Routes.Rooms.index,
            hidden: !isAllowed({ anyRoles: ['ADMIN'] }),
        },
        {
            id: 'professors',
            iconName: IconComponentsEnum.users,
            label: t('professors'),
            href: Routes.Professors.index,
            hidden: !isAllowed({ anyRoles: ['ADMIN'] }),
        },
        {
            id: 'daily-income',
            iconName: IconComponentsEnum.squaresFour,
            label: t('dailyIncome'),
            href: Routes.DailyIncome.index,
            hidden: !isAllowed({ anyRoles: ['ADMIN'] }),
        },
        {
            id: 'users',
            iconName: IconComponentsEnum.user,
            label: t('users'),
            href: Routes.Users.index,
            hidden: !isAllowed({ anyRoles: ['ADMIN'] }),
        },
    ];

    let sidebarLayoutClass =
        'fixed inset-y-0 left-0 z-50 w-[min(100vw-3rem,280px)] shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-70 lg:translate-x-0 lg:shadow-none';
    if (!isMobile) {
        sidebarLayoutClass = sidebarOpen ? 'w-70' : 'w-20 bg-primary-900';
    }

    return (
        <ProtectedRoute>
            <MobileSidebarContext.Provider value={mobileSidebarValue}>
                <div className="flex h-dvh overflow-x-clip overflow-y-hidden">
                    {isMobile && sidebarOpen && (
                        <button
                            type="button"
                            aria-label={t('closeMenu')}
                            className="fixed inset-0 z-40 touch-none overscroll-none bg-black/50 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <Sidebar
                        open={sidebarOpen}
                        setOpen={setSidebarOpen}
                        isMobile={isMobile}
                        className={twMerge(
                            'border-r border-gray-200 bg-white',
                            sidebarLayoutClass,
                            isMobile && !sidebarOpen && '-translate-x-full',
                        )}
                    >
                        <SidebarHeader className="p-4">
                            {(sidebarOpen || isMobile) && (
                                <Link href={Routes.Dashboard} className="flex shrink-0 items-center gap-2">
                                    <Image
                                        src={BiblioSquadLogo}
                                        alt={tCommon('brandLogoAlt')}
                                        height={40}
                                        className="w-auto object-contain"
                                        priority
                                    />
                                </Link>
                            )}
                            <SidebarTrigger id="sidebar-trigger" />
                        </SidebarHeader>

                        <SidebarContent
                            data={navigationItems}
                            className={twMerge('flex-1', sidebarOpen || isMobile ? 'p-4' : 'px-0 py-4')}
                        />

                        <SidebarFooter className={sidebarOpen || isMobile ? 'p-4' : 'px-0 py-4'}>
                            <LanguageSwitcher />
                            {sidebarOpen || isMobile ? (
                                <div className="mt-4 flex w-full items-center justify-between gap-2">
                                    <Avatar
                                        id="avatar"
                                        name={userName}
                                        email={session?.user?.email ?? undefined}
                                        size={ESize.md}
                                        className="min-w-0"
                                    />
                                    <Button
                                        id="sidebar-disconnect-expanded"
                                        type={EButtonType.secondary}
                                        icon={{
                                            name: IconComponentsEnum.logOut,
                                            size: ESize.sm,
                                            color: 'text-primary-400',
                                        }}
                                        onClick={() => signOut()}
                                    />
                                </div>
                            ) : (
                                <Avatar
                                    id="avatar"
                                    name={userName}
                                    size={ESize.lg}
                                    className="cursor-pointer"
                                />
                            )}
                        </SidebarFooter>
                    </Sidebar>

                    <main
                        className={twMerge(
                            'min-w-0 flex-1 overflow-y-auto bg-gray-25',
                            isMobile && sidebarOpen && 'overflow-hidden touch-none',
                        )}
                    >
                        {children}
                    </main>
                </div>
            </MobileSidebarContext.Provider>
        </ProtectedRoute>
    );
}

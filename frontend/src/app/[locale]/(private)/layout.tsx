'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from '@/components/Primitives/Sidebar/Sidebar';
import { EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { moduleForPath, moduleItemsForRole, modulesForRole } from '@/lib/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/Primitives/Button/Button';
import { MobileSidebarContext } from '@/contexts/MobileSidebarContext';
import { usePathname } from '@/i18n/navigation';
import { INavigationItem } from '@/interfaces/IPrimitives/ISidebar/ISidebar';
import ModuleSwitcher from '@/components/Organisms/ModuleSwitcher/ModuleSwitcher';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Avatar from '@/components/Primitives/Avatar/Avatar';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';
import ui from '@/theme/ui';

export default function PrivateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const t = useTranslations('sidebar');
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const isDesktop = useMediaQuery(`(min-width: ${ui.breakPoints.tablet})`);
    const isMobile = !isDesktop;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: session } = useSession();
    const userName = [session?.user?.firstName, session?.user?.lastName]
        .filter(Boolean)
        .join(' ') || tCommon('userFallback');
    const role = session?.user?.role;
    const pathname = usePathname();

    useEffect(() => {
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
        };
    }, []);

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

    const availableModules = useMemo(() => modulesForRole(role), [role]);
    const currentModule = moduleForPath(pathname) ?? availableModules[0];

    const navigationItems: INavigationItem[] = currentModule
        ? moduleItemsForRole(currentModule, role).map((item) => ({
              id: item.id,
              iconName: item.icon,
              label: t(item.labelKey),
              href: item.href,
              exact: item.exact,
              alsoActive: item.alsoActive,
          }))
        : [];

    const sidebarLayoutClass = sidebarOpen
        ? 'fixed inset-y-0 start-0 z-50 w-[min(100vw-3rem,280px)] shadow-xl tablet:static tablet:z-auto tablet:w-70 tablet:translate-x-0 tablet:shadow-none'
        : 'fixed inset-y-0 start-0 z-50 w-20 -translate-x-full shadow-none tablet:static tablet:z-auto tablet:w-20 tablet:translate-x-0 tablet:shadow-none';

    return (
        <ProtectedRoute>
            <NotificationListener />
            <MobileSidebarContext.Provider value={mobileSidebarValue}>
                <div className="flex h-dvh max-h-dvh w-full overflow-hidden">
                    {isMobile && sidebarOpen && (
                        <button
                            type="button"
                            aria-label={t('closeMenu')}
                            className="fixed inset-0 z-40 touch-none overscroll-none bg-black/50 tablet:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <Sidebar
                        open={sidebarOpen}
                        setOpen={setSidebarOpen}
                        isMobile={isMobile}
                        className={twMerge(
                            'border-e border-gray-200',
                            sidebarLayoutClass,
                            isMobile && sidebarOpen && 'ltr:translate-x-0 rtl:translate-x-0',
                            isMobile && !sidebarOpen && 'ltr:-translate-x-full rtl:translate-x-full',
                        )}
                    >
                        <SidebarHeader className="p-4">
                            {sidebarOpen && (
                                <Link href={Routes.Launcher} className="flex shrink-0 items-center gap-2">
                                    <BrandLogo
                                        alt={tCommon('brandLogoAlt')}
                                        height={30}
                                        className="w-auto object-contain"
                                        priority
                                    />
                                </Link>
                            )}
                            <SidebarTrigger id="sidebar-trigger" />
                        </SidebarHeader>

                        {currentModule ? (
                            <div className={sidebarOpen ? 'shrink-0 px-4 pb-2' : 'flex shrink-0 justify-center pb-2'}>
                                <ModuleSwitcher current={currentModule} modules={availableModules} />
                            </div>
                        ) : null}

                        <SidebarContent
                            data={navigationItems}
                            className={twMerge('flex-1', sidebarOpen ? 'p-4' : 'px-0 py-4')}
                        />

                        <SidebarFooter className={sidebarOpen ? 'p-4' : 'px-0 py-4'}>
                            {sidebarOpen ? (
                                <LanguageSwitcher compact={false} className="w-full" />
                            ) : (
                                <div className="flex justify-center">
                                    <LanguageSwitcher compact={true} />
                                </div>
                            )}
                            {sidebarOpen ? (
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
                                <>
                                    <Avatar
                                        id="avatar"
                                        name={userName}
                                        size={ESize.md}
                                    />
                                    <Button
                                        id="sidebar-disconnect-collapsed"
                                        type={EButtonType.tertiary}
                                        iconPosition="only"
                                        icon={{
                                            name: IconComponentsEnum.logOut,
                                            size: ESize.sm,
                                            color: 'text-primary-200',
                                        }}
                                        onClick={() => signOut()}
                                        aria-label={tAuth('logout')}
                                        className="flex size-10 items-center justify-center rounded-full bg-primary-800 text-primary-200 hover:bg-danger-600 hover:text-white transition-colors cursor-pointer border-none"
                                    />
                                </>
                            )}
                        </SidebarFooter>
                    </Sidebar>

                    <main
                        className={twMerge(
                            'min-h-0 min-w-0 flex-1 overflow-y-auto bg-gray-25',
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

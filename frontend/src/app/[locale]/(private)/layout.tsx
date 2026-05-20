'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Image from 'next/image';
import { Routes } from '@/lib/routes';
import { IconComponentsEnum, EButtonType, ESize, EVariantLabel } from '@/Enum/Enum';
import type { INavigationItem } from '@/interfaces';
import { signOut, useSession } from 'next-auth/react';
import { twMerge } from 'tailwind-merge';
import { useEffect, useMemo, useState } from 'react';
import {
    MoleculeSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMobileBar,
    SidebarOverlay,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/Molecules/MoleculeSidebar/MoleculeSidebar';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomIcon from '@/components/Atoms/AtomIcon/AtomIcon';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname } from '@/i18n/navigation';

const DESKTOP_QUERY = '(min-width: 1131px)';

export default function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const isMobile = !isDesktop;
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const role = session?.user?.role;
    const t = useTranslations();

    const userName = session?.user?.name || t('common.user');
    const userEmail = session?.user?.email || '';

    useEffect(() => {
        setOpen(isDesktop);
    }, [isDesktop]);

    useEffect(() => {
        if (isMobile) setOpen(false);
    }, [pathname, isMobile]);

    useEffect(() => {
        if (!isMobile || !open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMobile, open]);

    const navigation: INavigationItem[] = useMemo(() => {
        if (role !== 'ADMIN') return [];
        return [
            {
                id: 'admin-calendar',
                label: t('navigation.calendar'),
                href: Routes.AdminCalendar,
                iconName: IconComponentsEnum.calendar,
            },
            {
                id: 'public-booking',
                label: t('navigation.bookWithoutAccount'),
                href: Routes.Calendar,
                iconName: IconComponentsEnum.plus,
            },
            {
                id: 'admin-reservations',
                label: t('navigation.reservationsAdmin'),
                href: Routes.AdminReservations,
                iconName: IconComponentsEnum.layers,
            },
            {
                id: 'admin-rooms',
                label: t('navigation.rooms'),
                href: Routes.AdminRooms,
                iconName: IconComponentsEnum.squaresFour,
            },
            {
                id: 'admin-teachers',
                label: t('navigation.teachers'),
                href: Routes.AdminTeachers,
                iconName: IconComponentsEnum.users,
            },
        ];
    }, [role, t]);

    const sidebarExpanded = isMobile ? true : open;

    return (
        <ProtectedRoute>
            <SidebarProvider
                open={open}
                setOpen={setOpen}
                isMobile={isMobile}
                expanded={sidebarExpanded}
            >
                <div className="flex min-h-dvh w-full flex-col md:h-dvh md:max-h-dvh md:min-h-0 md:overflow-hidden md:flex-row">
                    <SidebarMobileBar />
                    <SidebarOverlay />

                    <MoleculeSidebar
                        open={open}
                        setOpen={setOpen}
                        isMobile={isMobile}
                        className={twMerge(
                            !isMobile && 'self-stretch border-r md:min-h-0',
                            !isMobile && (open ? 'w-[280px] border-gray-100 bg-white' : 'w-19 border-primary-900 bg-primary-900'),
                        )}
                    >
                        <SidebarHeader
                            className={twMerge(
                                'border-b',
                                sidebarExpanded ? 'border-gray-100 px-4 py-4' : 'border-primary-800 px-2 py-5',
                            )}
                        >
                            <div
                                className={twMerge(
                                    'flex w-full items-center',
                                    sidebarExpanded ? 'justify-between gap-3' : 'flex-col gap-4',
                                )}
                            >
                                {sidebarExpanded ? (
                                    <Image
                                        src="/branding/reservasquad-logo-horiz.png"
                                        alt={t('brand.name')}
                                        width={140}
                                        height={48}
                                        className={twMerge(
                                            'h-auto object-contain',
                                            sidebarExpanded ? 'w-[120px]' : 'w-17',
                                        )}
                                        priority
                                    />
                                ) : (
                                    <Image
                                        src="/branding/reservasquad-logo.png"
                                        alt=""
                                        width={140}
                                        height={40}
                                        className="h-9 w-auto object-contain brightness-0 invert"
                                    />
                                )}
                                <SidebarTrigger id="sidebar-collapse-toggle" />
                            </div>
                        </SidebarHeader>

                        <SidebarContent
                            data={navigation}
                            className={twMerge('px-2 py-4', isMobile && 'pt-2')}
                        />

                        <SidebarFooter
                            className={twMerge(
                                sidebarExpanded ? 'p-4' : 'flex flex-col items-center px-2 py-4',
                            )}
                        >
                            {sidebarExpanded ? (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500" className="block">
                                            {t('common.connected')}
                                        </AtomLabel>
                                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-primary-900" className="block">
                                            {userName}
                                        </AtomLabel>
                                        <AtomLabel
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-600"
                                            className="mt-1 block truncate"
                                        >
                                            {userEmail}
                                        </AtomLabel>
                                    </div>
                                    <AtomButton
                                        id="private-layout-sign-out"
                                        type={EButtonType.gray}
                                        className="justify-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent-50 hover:text-accent-700"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <AtomIcon
                                            name={IconComponentsEnum.logOut}
                                            size={ESize.md}
                                            color="text-gray-700"
                                        />
                                        {t('auth.signOut')}
                                    </AtomButton>
                                </div>
                            ) : (
                                <AtomButton
                                    id="private-layout-sign-out-icon"
                                    type={EButtonType.iconButton}
                                    className="flex size-10 items-center justify-center rounded-full bg-primary-800 text-white hover:bg-accent-500"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                >
                                    <AtomIcon name={IconComponentsEnum.logOut} size={ESize.md} color="text-white" />
                                </AtomButton>
                            )}
                        </SidebarFooter>
                    </MoleculeSidebar>

                    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}

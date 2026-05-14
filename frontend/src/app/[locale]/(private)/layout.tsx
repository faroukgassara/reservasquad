'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { AtomButton, Icon, Label } from '@/components/Atoms';
import {
    MoleculeSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '@/components/Molecules';
import Image from 'next/image';
import { Routes } from '@/lib/routes';
import { IconComponentsEnum, EButtonType, ESize, EVariantLabel } from '@/Enum/Enum';
import type { INavigationItem } from '@/interfaces';
import { signOut, useSession } from 'next-auth/react';
import { twMerge } from 'tailwind-merge';
import { useMemo, useState } from 'react';

export default function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [open, setOpen] = useState(true);
    const { data: session } = useSession();
    const role = session?.user?.role;

    const userName = session?.user?.name || 'Utilisateur';
    const userEmail = session?.user?.email || '';

    const navigation: INavigationItem[] = useMemo(() => {
        if (role !== 'ADMIN') return [];
        return [
            {
                id: 'admin-calendar',
                label: 'Calendrier',
                href: Routes.AdminCalendar,
                iconName: IconComponentsEnum.calendar,
            },
            {
                id: 'public-booking',
                label: 'Réserver (sans compte)',
                href: Routes.Calendar,
                iconName: IconComponentsEnum.plus,
            },
            {
                id: 'admin-reservations',
                label: 'Réservations (admin)',
                href: Routes.AdminReservations,
                iconName: IconComponentsEnum.layers,
            },
            {
                id: 'admin-rooms',
                label: 'Salles',
                href: Routes.AdminRooms,
                iconName: IconComponentsEnum.squaresFour,
            },
            {
                id: 'admin-teachers',
                label: 'Professeurs',
                href: Routes.AdminTeachers,
                iconName: IconComponentsEnum.users,
            },
        ];
    }, [role]);

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen w-full flex-col md:h-dvh md:max-h-dvh md:min-h-0 md:overflow-hidden md:flex-row">
                <MoleculeSidebar
                    open={open}
                    setOpen={setOpen}
                    className={twMerge(
                        'shrink-0 self-stretch border-r transition-[width] duration-200 ease-out md:min-h-0',
                        open ? 'w-[280px] border-gray-100 bg-white' : 'w-[4.75rem] border-primary-900 bg-primary-900',
                    )}
                >
                    <SidebarHeader
                        className={twMerge(
                            'border-b',
                            open ? 'border-gray-100 px-4 py-4' : 'border-primary-800 px-2 py-5',
                        )}
                    >
                        <div
                            className={twMerge(
                                'flex w-full items-center',
                                open ? 'justify-between gap-3' : 'flex-col gap-4',
                            )}
                        >
                            <Image
                                src="/branding/reservasquad-logo-horiz.png"
                                alt="Reserva Squad"
                                width={140}
                                height={48}
                                className={twMerge(
                                    'h-auto object-contain',
                                    open ? 'w-[120px]' : 'w-[4.25rem]',
                                )}
                                priority
                            />
                            <SidebarTrigger id="sidebar-collapse-toggle" />
                        </div>
                    </SidebarHeader>

                    <SidebarContent data={navigation} className="px-2 py-4" />

                    <SidebarFooter
                        className={twMerge(open ? 'p-4' : 'flex flex-col items-center px-2 py-4')}
                    >
                        {open ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="block">
                                        Connecté
                                    </Label>
                                    <Label variant={EVariantLabel.bodySmall} color="text-primary-900" className="block">
                                        {userName}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-600"
                                        className="mt-1 block truncate"
                                    >
                                        {userEmail}
                                    </Label>
                                </div>
                                <AtomButton
                                    id="private-layout-sign-out"
                                    type={EButtonType.gray}
                                    className="justify-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent-50 hover:text-accent-700"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                >
                                    <Icon
                                        name={IconComponentsEnum.logOut}
                                        size={ESize.md}
                                        color="text-gray-700"
                                    />
                                    Déconnexion
                                </AtomButton>
                            </div>
                        ) : (
                            <AtomButton
                                id="private-layout-sign-out-icon"
                                type={EButtonType.iconButton}
                                className="flex size-10 items-center justify-center rounded-full bg-primary-800 text-white hover:bg-accent-500"
                                onClick={() => signOut({ callbackUrl: '/' })}
                            >
                                <Icon name={IconComponentsEnum.logOut} size={ESize.md} color="text-white" />
                            </AtomButton>
                        )}
                    </SidebarFooter>
                </MoleculeSidebar>

                <main className="min-h-0 flex-1 overflow-y-auto bg-primary-25 md:min-h-0">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

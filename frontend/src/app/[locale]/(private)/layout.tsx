'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Image from 'next/image';
import { Routes } from '@/lib/routes';
import { Link, usePathname } from '@/i18n/navigation';
import { signOut, useSession } from 'next-auth/react';
import { twMerge } from 'tailwind-merge';
import { useAuthorization } from '@/hooks/useAuthorization';

const NAVY = '#253165';
const BRAND_RED = '#E5191D';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '';
    const { data: session } = useSession();
    const { isAllowed } = useAuthorization();

    const userName = session?.user?.name || 'Utilisateur';

    const items = [
        { label: 'Calendrier', href: Routes.Calendar },
        { label: 'Mes réservations', href: Routes.MyReservations },
        ...(isAllowed({ anyRoles: ['ADMIN'] })
            ? ([
                  { label: 'Réservations (admin)', href: Routes.AdminReservations },
                  { label: 'Salles (admin)', href: Routes.AdminRooms },
              ] as const)
            : []),
    ];

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen flex-col md:flex-row">
                <aside
                    className="flex w-full flex-shrink-0 flex-col border-b border-white/15 md:h-screen md:w-56 md:border-b-0 md:border-r md:border-[#33447a]"
                    style={{ backgroundColor: NAVY }}
                >
                    <div className="flex items-center gap-3 p-4">
                        <Image
                            src="/branding/reservasquad-logo.png"
                            alt="Reserva Squad"
                            width={160}
                            height={56}
                            className="h-auto w-[140px] object-contain"
                            priority
                        />
                    </div>
                    <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
                        {items.map((item) => {
                            const active =
                                pathname === item.href || (pathname ?? '').endsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={twMerge(
                                        'rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10',
                                        active && 'bg-white/15 text-white',
                                    )}
                                    style={
                                        active
                                            ? { borderLeft: `3px solid ${BRAND_RED}` }
                                            : undefined
                                    }
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-auto flex flex-col gap-2 border-t border-white/10 p-4 text-white/90">
                        <div className="text-xs">{userName}</div>
                        <div className="truncate text-xs opacity-75">{session?.user?.email}</div>
                        <button
                            type="button"
                            className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/20"
                            onClick={() => signOut({ callbackUrl: '/' })}
                        >
                            Déconnexion
                        </button>
                    </div>
                </aside>

                <main className="min-h-[calc(100vh-80px)] flex-1 overflow-y-auto bg-slate-50 md:min-h-screen">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

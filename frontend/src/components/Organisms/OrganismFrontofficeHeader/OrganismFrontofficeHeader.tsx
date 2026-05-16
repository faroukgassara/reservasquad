'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { EVariantLabel } from '@/Enum/Enum';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';

const navLinks = [
    { href: Routes.Home, label: 'Accueil' },
    { href: Routes.Calendar, label: 'Réserver une salle' },
] as const;

export default function OrganismFrontofficeHeader() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <AtomDiv
            role="banner"
            className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white"
        >
            <AtomDiv className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link href={Routes.Home} className="flex shrink-0 items-center">
                    <Image
                        src="/branding/reservasquad-logo.png"
                        alt="Reserva Squad"
                        width={160}
                        height={48}
                        className="h-10 w-auto object-contain"
                        priority
                    />
                </Link>

                <AtomDiv role="navigation" className="hidden items-center gap-6 md:flex">
                    {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href} className="group transition-colors">
                            <AtomLabel
                                variant={EVariantLabel.bodySmall}
                                color="text-gray-900"
                                className="font-medium group-hover:text-primary-700"
                            >
                                {label}
                            </AtomLabel>
                        </Link>
                    ))}
                </AtomDiv>

                <AtomDiv className="flex shrink-0 items-center gap-3">
                    {session ? (
                        isAdmin ?
                            <Link
                                href={Routes.AdminReservations}
                                className="rounded-lg bg-primary-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800"
                            >
                                Administration
                            </Link>
                        :   null
                    ) : (
                        <Link
                            href={Routes.Login}
                            className="rounded-lg bg-primary-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800"
                        >
                            Connexion
                        </Link>
                    )}
                </AtomDiv>
            </AtomDiv>
        </AtomDiv>
    );
}

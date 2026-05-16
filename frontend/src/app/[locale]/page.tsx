'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import Image from 'next/image';

export default function HomePage() {
    return (
        <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-16 text-center">
            <Image
                src="/branding/reservasquad-logo.png"
                alt="Reserva Squad"
                width={220}
                height={120}
                className="h-auto w-[200px]"
                priority
            />
            <div>
                <h1 className="text-3xl font-semibold md:text-4xl text-primary-900">
                    Réservez vos salles d&apos;étude
                </h1>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                    Calendrier partagé, validation par l&apos;administration, équipements par salle.
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                <Link
                    href={Routes.Login}
                    className="rounded-lg px-6 py-3 font-semibold text-white shadow bg-primary-900"
                >
                    Connexion
                </Link>
                <Link
                    href={Routes.Calendar}
                    className="rounded-lg border-2 px-6 py-3 font-semibold text-accent-500 border-accent-500"
                >
                    Réserver une salle
                </Link>
            </div>
        </main>
    );
}

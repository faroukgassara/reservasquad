'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function HomePage() {
    const t = useTranslations();

    return (
        <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-16 text-center">
            <Image
                src="/branding/reservasquad-logo.png"
                alt={t('brand.name')}
                width={220}
                height={120}
                className="h-auto w-[200px]"
                priority
            />
            <div>
                <h1 className="text-3xl font-semibold md:text-4xl text-primary-900">
                    {t('home.title')}
                </h1>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                    {t('home.subtitle')}
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                <Link
                    href={Routes.Login}
                    className="rounded-lg px-6 py-3 font-semibold text-white shadow bg-primary-900"
                >
                    {t('auth.login')}
                </Link>
                <Link
                    href={Routes.Calendar}
                    className="rounded-lg border-2 px-6 py-3 font-semibold text-accent-500 border-accent-500"
                >
                    {t('home.bookRoom')}
                </Link>
            </div>
        </main>
    );
}

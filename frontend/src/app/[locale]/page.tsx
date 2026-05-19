'use client';

import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function HomePage() {
    const t = useTranslations();

    return (
        <LayoutWrapper
            title={t('home.title')}
            subTitle={t('home.subtitle')}
            mainSection={
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 text-center">
                    <Image
                        src="/branding/reservasquad-logo.png"
                        alt={t('brand.name')}
                        width={220}
                        height={120}
                        className="h-auto w-[200px]"
                        priority
                    />
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
                </div>
            }
        />
    );
}

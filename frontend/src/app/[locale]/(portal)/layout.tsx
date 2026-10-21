'use client';

import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrganismAppTopBar from '@/components/Organisms/AppTopBar/OrganismAppTopBar';
import { Routes } from '@/lib/routes';

export default function PortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const t = useTranslations('portal');

    return (
        <ProtectedRoute>
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">
                <OrganismAppTopBar
                    homeHref={Routes.Portal.index}
                    links={[
                        { href: Routes.Portal.index, label: t('nav.overview'), exact: true },
                        { href: Routes.Portal.book, label: t('nav.book') },
                        { href: Routes.Portal.history, label: t('nav.history') },
                    ]}
                />
                <main className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 laptop:p-8">{children}</div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

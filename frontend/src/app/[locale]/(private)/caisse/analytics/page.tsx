'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismProductAnalytics from '@/components/Organisms/Pos/OrganismProductAnalytics';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';

export default function PosProductAnalyticsPage() {
    const t = useTranslations('pos.analytics');
    const router = useRouter();
    const { status } = useSession();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    useEffect(() => {
        if (status !== 'loading' && !isAdmin) {
            router.replace(Routes.Pos.index);
        }
    }, [status, isAdmin, router]);

    if (status === 'loading' || !isAdmin) {
        return null;
    }

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={<OrganismProductAnalytics />}
        />
    );
}

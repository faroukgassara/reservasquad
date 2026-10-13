'use client';

import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismProductAnalytics from '@/components/Organisms/Pos/OrganismProductAnalytics';

export default function PosProductAnalyticsPage() {
    const t = useTranslations('pos.analytics');

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={<OrganismProductAnalytics />}
        />
    );
}

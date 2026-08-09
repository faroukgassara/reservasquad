'use client';

import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import { EVariantLabel } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '@/lib/reservation-api';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
    });

    const cards = [
        {
            label: t('statsRooms'),
            value: data?.rooms ?? 0,
            href: Routes.Rooms.index,
        },
        {
            label: t('statsProfessors'),
            value: data?.professors ?? 0,
            href: Routes.Professors.index,
        },
        {
            label: t('statsToday'),
            value: data?.todayReservations ?? 0,
            href: Routes.Reservations.index,
        },
    ];

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={
                <Div className="mx-auto max-w-7xl">
                    <Div className="mb-8 sm:mb-10">
                        <Label variant={EVariantLabel.h3} color="text-gray-900">
                            {t('welcome')}
                        </Label>
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-600" className="mt-2">
                            {t('welcomeBody')}
                        </Label>
                    </Div>

                    <Div className="grid gap-4 sm:grid-cols-3">
                        {cards.map((card) => (
                            <Link key={card.label} href={card.href} className="block">
                                <Div className="rounded-xxl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary-200">
                                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                                        {card.label}
                                    </Label>
                                    <Label variant={EVariantLabel.h3} color="text-primary-600" className="mt-2 block">
                                        {isLoading ? '—' : card.value}
                                    </Label>
                                </Div>
                            </Link>
                        ))}
                    </Div>
                </Div>
            }
        />
    );
}

'use client';

import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import ModuleCard, { IModuleCardStat } from '@/components/Organisms/Launcher/ModuleCard';
import { EVariantLabel } from '@/Enum/Enum';
import { ModuleId, moduleItemsForRole, modulesForRole } from '@/lib/navigation';
import { fetchTodaySnapshot } from '@/lib/reservation-api';
import { fetchCurrentPosSession, fetchPosLowStockProducts } from '@/lib/pos-api';
import { fetchDailyIncomeSummary, formatMoney } from '@/lib/daily-income-api';

export default function LauncherPage() {
    const t = useTranslations('launcher');
    const locale = useLocale();
    const tSidebar = useTranslations('sidebar');
    const router = useRouter();
    const { data: session, status } = useSession();
    const role = session?.user?.role;
    const firstName = session?.user?.firstName;

    const modules = useMemo(() => modulesForRole(role), [role]);
    const hasModule = (id: ModuleId) => modules.some((module) => module.id === id);

    useEffect(() => {
        if (status === 'authenticated' && modules.length === 1) {
            router.replace(modules[0].homeHref);
        }
    }, [status, modules, router]);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data: today, isLoading: todayLoading } = useQuery({
        queryKey: ['today-snapshot'],
        queryFn: fetchTodaySnapshot,
        enabled: hasModule('reservations'),
    });

    const { data: currentSession, isLoading: sessionLoading } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
        enabled: hasModule('caisse'),
    });

    const { data: lowStock, isLoading: lowStockLoading } = useQuery({
        queryKey: ['pos-products-low-stock'],
        queryFn: () => fetchPosLowStockProducts(6),
        enabled: hasModule('caisse'),
    });

    const { data: incomeSummary, isLoading: incomeLoading } = useQuery({
        queryKey: ['daily-income-summary', year, month],
        queryFn: () => fetchDailyIncomeSummary({ year, month }),
        enabled: hasModule('recettes'),
    });

    const cardContent: Record<ModuleId, { stats: IModuleCardStat[]; isLoading: boolean }> = {
        reservations: {
            isLoading: todayLoading,
            stats: today
                ? [
                      { label: t('stats.reservationsToday'), value: String(today.counts.confirmedToday) },
                      {
                          label: t('stats.roomsOccupied'),
                          value: `${today.counts.roomsOccupied} / ${today.counts.roomsOccupied + today.counts.roomsFree}`,
                      },
                      { label: t('stats.unpaidToday'), value: String(today.counts.unpaidToday) },
                  ]
                : [],
        },
        caisse: {
            isLoading: sessionLoading || lowStockLoading,
            stats: [
                {
                    label: t('stats.session'),
                    value: currentSession ? t('stats.sessionOpen') : t('stats.sessionClosed'),
                },
                { label: t('stats.lowStock'), value: String(lowStock?.total ?? 0) },
            ],
        },
        recettes: {
            isLoading: incomeLoading,
            stats: incomeSummary
                ? [
                      { label: t('stats.incomeMonth'), value: formatMoney(incomeSummary.totalIncome) },
                      { label: t('stats.netBalance'), value: formatMoney(incomeSummary.netBalance) },
                  ]
                : [],
        },
        admin: { isLoading: false, stats: [] },
    };

    const todayLabel = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(now);

    return (
        <Div className="flex flex-col gap-6 laptop:h-full">
            <Div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <Div className="flex flex-col gap-1">
                    <Label variant={EVariantLabel.h3} color="text-gray-900" className="font-bold! break-words">
                        {firstName ? t('greeting', { name: firstName }) : t('greetingFallback')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-500">
                        {t('subtitle')}
                    </Label>
                </Div>
                <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="shrink-0 font-medium first-letter:uppercase">
                    {todayLabel}
                </Label>
            </Div>

            <Div className="grid grid-cols-1 gap-4 sm:grid-cols-2 laptop:max-h-128 laptop:min-h-0 laptop:flex-1 laptop:grid-cols-4 laptop:gap-5">
                {modules.map((module) => (
                    <ModuleCard
                        key={module.id}
                        id={module.id}
                        href={module.homeHref}
                        icon={module.icon}
                        tone={module.tone}
                        title={tSidebar(`modules.${module.id}`)}
                        description={t(`descriptions.${module.id}`)}
                        stats={cardContent[module.id].stats}
                        shortcuts={
                            module.id === 'admin'
                                ? moduleItemsForRole(module, role).map((item) => tSidebar(item.labelKey))
                                : undefined
                        }
                        isLoading={cardContent[module.id].isLoading}
                        openLabel={t('open')}
                    />
                ))}
            </Div>
        </Div>
    );
}

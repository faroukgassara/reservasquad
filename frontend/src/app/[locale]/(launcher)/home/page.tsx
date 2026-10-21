'use client';

import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import ModuleCard, { IModuleCardStat, TModuleCardTone } from '@/components/Organisms/Launcher/ModuleCard';
import { EVariantLabel } from '@/Enum/Enum';
import { ModuleId, moduleItemsForRole, modulesForRole } from '@/lib/navigation';
import { fetchTodaySnapshot } from '@/lib/reservation-api';
import { fetchCurrentPosSession, fetchPosLowStockProducts } from '@/lib/pos-api';
import { fetchDailyIncomeSummary, formatMoney } from '@/lib/daily-income-api';

const MODULE_TONES: Record<ModuleId, TModuleCardTone> = {
    reservations: 'primary',
    caisse: 'accent',
    recettes: 'success',
    admin: 'warning',
};

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
        <Div className="flex flex-col gap-6 sm:gap-8">
            <Div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-500 px-6 py-7 shadow-lg sm:px-8 sm:py-9">
                <Div aria-hidden="true" className="absolute -end-16 -top-20 size-64 rounded-full bg-accent-500/25 blur-2xl" />
                <Div aria-hidden="true" className="absolute -bottom-24 end-1/3 size-56 rounded-full bg-white/10 blur-2xl" />
                <Div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <Div className="flex flex-col gap-1.5">
                        <Label variant={EVariantLabel.h3} color="text-white">
                            {firstName ? t('greeting', { name: firstName }) : t('greetingFallback')}
                        </Label>
                        <Label variant={EVariantLabel.body} color="text-white" className="opacity-80">
                            {t('subtitle')}
                        </Label>
                    </Div>
                    <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-1.5 ring-1 ring-white/25 backdrop-blur-sm">
                        <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-medium first-letter:uppercase">
                            {todayLabel}
                        </Label>
                    </span>
                </Div>
            </Div>

            <Div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 laptop:grid-cols-4">
                {modules.map((module) => (
                    <ModuleCard
                        key={module.id}
                        id={module.id}
                        href={module.homeHref}
                        icon={module.icon}
                        tone={MODULE_TONES[module.id]}
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

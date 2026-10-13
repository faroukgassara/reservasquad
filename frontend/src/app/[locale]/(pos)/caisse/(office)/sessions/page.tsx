'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import PosSalesDetailsModal from '@/components/Modals/PosSalesDetailsModal/PosSalesDetailsModal';
import { useModal } from '@/contexts/ModalContext';
import Badge from '@/components/Primitives/Badge/Badge';
import StatCard from '@/components/Primitives/StatCard/StatCard';
import Button from '@/components/Primitives/Button/Button';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import { fetchPosSessions, formatPosDateTime, getSessionCashPayments, personName, type PosSession } from '@/lib/pos-api';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

export default function PosSessionsPage() {
    const t = useTranslations('pos');
    const router = useRouter();
    const [page, setPage] = useState(1);
    const { openModal, modalPortal } = useModal();

    const { data, isLoading } = useQuery({
        queryKey: ['pos-sessions', page],
        queryFn: () => fetchPosSessions({ page, perPage: 10 }),
    });

    const sessions = data?.data ?? [];
    const stats = useMemo(() => {
        const totalCount = data?.meta?.total ?? 0;
        const openCount =
            data?.summary?.openSessionsCount ?? sessions.filter((s) => s.status === 'OPEN').length;
        const totalCash =
            data?.summary?.totalCashCollected ??
            sessions.reduce((sum, s) => sum + getSessionCashPayments(s), 0);
        return { totalCount, openCount, totalCash };
    }, [
        data?.meta?.total,
        data?.summary?.openSessionsCount,
        data?.summary?.totalCashCollected,
        sessions,
    ]);

    const columns = useMemo(
        (): ITableColumn<PosSession>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: t('session.number'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell mainText={`#${row.number}`} supportingText={personName(row.openedBy)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'openedAt',
                    label: t('session.openedAt'),
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell mainText={formatPosDateTime(row.openedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'closedAt',
                    label: t('session.closedAt'),
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell mainText={formatPosDateTime(row.closedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'orders',
                    label: t('session.orders'),
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell mainText={String(row._count?.orders ?? 0)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'cashPayments',
                    label: t('session.cashPayments'),
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell mainText={formatMoney(getSessionCashPayments(row))} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('session.status'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell
                            leftChildren={
                                <Badge
                                    id={`pos-session-status-${row.id}`}
                                    text={row.status === 'OPEN' ? t('session.statusOpen') : t('session.statusClosed')}
                                    type={row.status === 'OPEN' ? EBadgeType.success : EBadgeType.reverror}
                                    size={EBadgeSize.small}
                                />
                            }
                        />
                    ),
                },
            },
        ],
        [t],
    );

    return (
        <>
            {modalPortal(<PosSalesDetailsModal />)}
            <LayoutWrapper
                title={t('sessions.title')}
                subTitle={t('sessions.subtitle')}
                rightActions={
                    <Button
                        id="pos-sessions-sales-details"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.filetext, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('sessions.salesDetails')}
                        onClick={openModal}
                    />
                }
                mainSection={
                    <div className="flex min-h-full flex-col gap-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                            <StatCard
                                icon={IconComponentsEnum.layers}
                                iconBg="bg-primary-50"
                                iconColor="text-primary-600"
                                label={t('sessions.totalSessions')}
                                value={isLoading ? '—' : String(stats.totalCount)}
                                isLoading={isLoading}
                            />
                            <StatCard
                                icon={IconComponentsEnum.checkCircle}
                                iconBg="bg-success-50"
                                iconColor="text-success-600"
                                label={t('sessions.openSessions')}
                                value={isLoading ? '—' : String(stats.openCount)}
                                isLoading={isLoading}
                            />
                            <StatCard
                                icon={IconComponentsEnum.star}
                                iconBg="bg-accent-50"
                                iconColor="text-accent-600"
                                label={t('sessions.cashCollected')}
                                value={isLoading ? '—' : formatMoney(stats.totalCash)}
                                isLoading={isLoading}
                            />
                        </div>
                        <OrganismTable<PosSession>
                            columns={columns}
                            rows={sessions}
                            pageSize={10}
                            searchable={false}
                            isLoading={isLoading}
                            emptyMessage={t('sessions.empty')}
                            page={page}
                            totalRows={data?.meta?.total ?? 0}
                            onPageChange={setPage}
                            onClickRow={(row) => router.push(Routes.Pos.session(row.id))}
                        />
                    </div>
                }
            />
        </>
    );
}

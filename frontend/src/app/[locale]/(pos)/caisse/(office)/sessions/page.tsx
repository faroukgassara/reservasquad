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
import Button from '@/components/Primitives/Button/Button';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import { fetchPosSessions, formatPosDateTime, personName, toAmount, type PosSession } from '@/lib/pos-api';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

function differenceBadgeType(value: number): EBadgeType {
    if (value === 0) return EBadgeType.success;
    return value > 0 ? EBadgeType.primary : EBadgeType.error;
}

export default function PosSessionsPage() {
    const t = useTranslations('pos');
    const router = useRouter();
    const [page, setPage] = useState(1);
    const { openModal, modalPortal } = useModal();

    const { data, isLoading } = useQuery({
        queryKey: ['pos-sessions', page],
        queryFn: () => fetchPosSessions({ page, perPage: 10 }),
    });

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
                        <OrganismTable.Cell
                            mainText={formatPosDateTime(row.openedAt)}
                            supportingText={formatMoney(toAmount(row.openingCash))}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'closedAt',
                    label: t('session.closedAt'),
                    render: (_: unknown, row: PosSession) => (
                        <OrganismTable.Cell
                            mainText={formatPosDateTime(row.closedAt)}
                            supportingText={
                                row.countedCash === null ? undefined : formatMoney(toAmount(row.countedCash))
                            }
                        />
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
                    value: 'difference',
                    label: t('session.difference'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosSession) => {
                        if (row.status === 'OPEN') {
                            return (
                                <Badge
                                    id={`pos-session-status-${row.id}`}
                                    text={t('session.statusOpen')}
                                    type={EBadgeType.warning}
                                    size={EBadgeSize.small}
                                />
                            );
                        }
                        const difference = toAmount(row.difference);
                        return (
                            <Badge
                                id={`pos-session-difference-${row.id}`}
                                text={formatMoney(difference)}
                                type={differenceBadgeType(difference)}
                                size={EBadgeSize.small}
                            />
                        );
                    },
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
                    <OrganismTable<PosSession>
                        columns={columns}
                        rows={data?.data ?? []}
                        pageSize={10}
                        isLoading={isLoading}
                        emptyMessage={t('sessions.empty')}
                        page={page}
                        totalRows={data?.meta?.total ?? 0}
                        onPageChange={setPage}
                        onClickRow={(row) => router.push(Routes.Pos.session(row.id))}
                    />
                }
            />
        </>
    );
}

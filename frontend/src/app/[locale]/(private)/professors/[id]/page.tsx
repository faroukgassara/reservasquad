'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import UnpaidStatCard from '@/components/Primitives/UnpaidStatCard/UnpaidStatCard';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import { fetchProfessorById } from '@/lib/professor-api';
import {
    fetchReservations,
    formatMoney,
    type ReservationRecord,
} from '@/lib/reservation-api';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import Spinner from '@/components/Primitives/Spinner/Spinner';

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

type PaidFilter = 'all' | 'paid' | 'unpaid';

export default function ProfessorDetailPage() {
    const t = useTranslations('admin.professors');
    const tRes = useTranslations('admin.reservations');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const params = useParams<{ id: string }>();
    const professorId = params.id;
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const canManage = isAllowed({ anyRoles: ['ADMIN', 'USER'] });
    const [page, setPage] = useState(1);
    const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');

    useEffect(() => {
        if (!canManage) router.replace(Routes.Today);
    }, [canManage, router]);

    const { data: professor, isLoading: professorLoading } = useQuery({
        queryKey: ['professor', professorId],
        queryFn: () => fetchProfessorById(professorId),
        enabled: canManage && !!professorId,
    });

    const { data: reservationsData, isLoading: reservationsLoading } = useQuery({
        queryKey: ['professor-reservations', professorId, page, paidFilter, statusFilter],
        queryFn: () =>
            fetchReservations({
                page,
                perPage: 10,
                professorId,
                sortBy: 'startAt',
                sortOrder: 'desc',
                ...(paidFilter === 'paid' ? { isPaid: true } : {}),
                ...(paidFilter === 'unpaid' ? { isPaid: false } : {}),
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
            }),
        enabled: canManage && !!professorId,
    });

    const rows = reservationsData?.data ?? [];
    const totalRows = reservationsData?.meta?.total ?? 0;

    const paidOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllPayments') },
            { value: 'paid', label: tRes('paid') },
            { value: 'unpaid', label: tRes('unpaid') },
        ],
        [t, tRes],
    );

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: t('filterAllStatuses') },
            { value: 'CONFIRMED', label: tStatus('confirmed') },
            { value: 'CANCELLED', label: tStatus('cancelled') },
        ],
        [t, tStatus],
    );

    const columns = useMemo(
        (): ITableColumn<ReservationRecord>[] => [
            {
                headerElement: {
                    value: 'title',
                    label: tRes('titleField'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={row.title || row.room?.name || '—'}
                            supportingText={row.room?.name}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'startAt',
                    label: tRes('startAt'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell
                            mainText={formatDateTime(row.startAt)}
                            supportingText={formatDateTime(row.endAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: tRes('price'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'isPaid',
                    label: tRes('payment'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <Badge
                            id={`prof-res-paid-${row.id}`}
                            text={row.isPaid ? tRes('paid') : tRes('unpaid')}
                            type={row.isPaid ? EBadgeType.success : EBadgeType.warning}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tRes('status'),
                    render: (_: unknown, row: ReservationRecord) => (
                        <Badge
                            id={`prof-res-status-${row.id}`}
                            text={
                                row.status === 'CONFIRMED'
                                    ? tStatus('confirmed')
                                    : tStatus('cancelled')
                            }
                            type={
                                row.status === 'CONFIRMED'
                                    ? EBadgeType.success
                                    : EBadgeType.warning
                            }
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [tRes, tStatus],
    );

    if (!canManage) return null;

    let subtitle = t('subtitle');
    if (professor) {
        subtitle = `${professor.firstName} ${professor.lastName}`;
        if (professor.specialty) {
            subtitle = `${subtitle} · ${professor.specialty}`;
        }
    }

    const backButton = (
        <Button
            id="professor-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{
                name: IconComponentsEnum.arrowLeft,
                size: ESize.md,
                color: 'text-primary-600',
            }}
            onClick={() => router.push(Routes.Professors.index)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    return (
        <LayoutWrapper
            title={t('detailTitle')}
            subTitle={professorLoading ? '…' : subtitle}
            leftActions={backButton}
            mainSection={
                professorLoading ? (
                    <Div className="flex min-h-48 items-center justify-center py-16">
                        <Spinner color="text-primary-500" size="lg" />
                    </Div>
                ) : (
                    <Div className="min-h-full space-y-4">
                        <Div className="grid gap-3 sm:grid-cols-2">
                            <UnpaidStatCard
                                label={t('unpaidTotal')}
                                value={formatMoney(professor?.unpaidTotal ?? 0)}
                                supportingText={t('unpaidCount', { count: professor?.unpaidCount ?? 0 })}
                            />
                            <UnpaidStatCard
                                tone="paid"
                                label={t('paidTotal')}
                                value={formatMoney(professor?.paidTotal ?? 0)}
                                supportingText={t('paidCount', { count: professor?.paidCount ?? 0 })}
                            />
                        </Div>

                        <Div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <Div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                                <Dropdown
                                    label={tRes('payment')}
                                    options={paidOptions}
                                    value={paidFilter}
                                    onChange={(value) => {
                                        if (value === 'all' || value === 'paid' || value === 'unpaid') {
                                            setPaidFilter(value);
                                            setPage(1);
                                        }
                                    }}
                                />
                                <Dropdown
                                    label={tRes('status')}
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={(value) => {
                                        if (
                                            value === 'all' ||
                                            value === 'CONFIRMED' ||
                                            value === 'CANCELLED'
                                        ) {
                                            setStatusFilter(value);
                                            setPage(1);
                                        }
                                    }}
                                />
                            </Div>
                        </Div>

                        <OrganismTable<ReservationRecord>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable={false}
                            isLoading={reservationsLoading}
                            emptyMessage={tCommon('empty')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                        />
                    </Div>
                )
            }
        />
    );
}

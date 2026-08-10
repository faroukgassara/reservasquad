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
import Label from '@/components/Primitives/Label/Label';
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
    EVariantLabel,
} from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

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
        if (!canManage) router.replace(Routes.Dashboard);
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

    return (
        <LayoutWrapper
            title={t('detailTitle')}
            subTitle={subtitle}
            mainSection={
                <Div className="min-h-full space-y-4">
                    <Div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <Button
                            id="professor-back"
                            type={EButtonType.secondary}
                            size={EButtonSize.small}
                            text={tCommon('back')}
                            onClick={() => router.push(Routes.Professors.index)}
                        />
                        <Div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <Div className="w-full sm:w-48">
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
                            </Div>
                            <Div className="w-full sm:w-48">
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
                    </Div>

                    {professorLoading ? (
                        <Label variant={EVariantLabel.body} color="text-gray-500">
                            …
                        </Label>
                    ) : null}

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
            }
        />
    );
}

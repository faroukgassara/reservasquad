'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import { EVariantLabel } from '@/Enum/Enum';
import { fetchAuditLogs, type AuditLogRecord } from '@/lib/audit-log-api';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

function formatDate(value: string): string {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function actionLabel(
    t: ReturnType<typeof useTranslations<'admin.auditLog'>>,
    action: string,
): string {
    const known = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'CANCEL',
        'BULK_PAID',
        'SERIES_CREATE',
    ] as const;
    if ((known as readonly string[]).includes(action)) {
        return t(`actions.${action as (typeof known)[number]}`);
    }
    return action;
}

function entityLabel(
    t: ReturnType<typeof useTranslations<'admin.auditLog'>>,
    entityType: string,
): string {
    const known = ['RESERVATION', 'DAILY_INCOME', 'INCOME_LINE'] as const;
    if ((known as readonly string[]).includes(entityType)) {
        return t(`entities.${entityType as (typeof known)[number]}`);
    }
    return entityType;
}

function userLabel(row: AuditLogRecord): string {
    if (!row.user) return '—';
    return `${row.user.firstName} ${row.user.lastName}`.trim() || row.user.email;
}


export default function AuditLogPage() {
    const t = useTranslations('admin.auditLog');
    const router = useRouter();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const [page, setPage] = useState(1);
    const [entityType, setEntityType] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (!isAdmin) {
            router.replace(Routes.Dashboard);
        }
    }, [isAdmin, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['audit-log', page, entityType, sortBy, sortOrder],
        queryFn: () =>
            fetchAuditLogs({
                page,
                perPage: 20,
                entityType: entityType || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: isAdmin,
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta.total ?? 0;

    const columns = useMemo(
        (): ITableColumn<AuditLogRecord>[] => [
            {
                headerElement: {
                    value: 'createdAt',
                    label: t('columns.date'),
                    sortable: true,
                    width: '170px',
                    render: (_: unknown, row: AuditLogRecord) => (
                        <OrganismTable.Cell mainText={formatDate(row.createdAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'user',
                    label: t('columns.user'),
                    width: '180px',
                    render: (_: unknown, row: AuditLogRecord) => (
                        <OrganismTable.Cell mainText={userLabel(row)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'action',
                    label: t('columns.action'),
                    sortable: true,
                    width: '140px',
                    render: (_: unknown, row: AuditLogRecord) => (
                        <OrganismTable.Cell mainText={actionLabel(t, row.action)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'entityType',
                    label: t('columns.entity'),
                    sortable: true,
                    width: '150px',
                    render: (_: unknown, row: AuditLogRecord) => (
                        <OrganismTable.Cell mainText={entityLabel(t, row.entityType)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'summary',
                    label: t('columns.summary'),
                    render: (_: unknown, row: AuditLogRecord) => (
                        <OrganismTable.Cell mainText={row.summary || '—'} />
                    ),
                },
            },
        ],
        [t],
    );

    if (!isAdmin) {
        return null;
    }

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={
                <Div className="min-h-full space-y-4">
                    <Div className="flex flex-wrap items-center gap-2">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {t('filterEntity')}
                        </Label>
                        <select
                            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-800"
                            value={entityType}
                            onChange={(event) => {
                                setEntityType(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">{t('entities.all')}</option>
                            <option value="RESERVATION">{t('entities.RESERVATION')}</option>
                            <option value="DAILY_INCOME">{t('entities.DAILY_INCOME')}</option>
                            <option value="INCOME_LINE">{t('entities.INCOME_LINE')}</option>
                        </select>
                    </Div>

                    <OrganismTable<AuditLogRecord>
                        columns={columns}
                        rows={rows}
                        pageSize={20}
                        searchable={false}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        page={page}
                        totalRows={totalRows}
                        onPageChange={setPage}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onSort={(key, direction) => {
                            setSortBy(key);
                            setSortOrder(direction);
                            setPage(1);
                        }}
                    />
                </Div>
            }
        />
    );
}

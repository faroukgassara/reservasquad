'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import PosOrderDetailModal from '@/components/Modals/PosOrderDetailModal/PosOrderDetailModal';
import PosSalesDetailsModal from '@/components/Modals/PosSalesDetailsModal/PosSalesDetailsModal';
import PosInfoRow from '@/components/Organisms/Pos/PosInfoRow';
import PosStatButton from '@/components/Organisms/Pos/PosStatButton';
import PosStatusPipeline from '@/components/Organisms/Pos/PosStatusPipeline';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useModal } from '@/contexts/ModalContext';
import { formatMoney } from '@/lib/daily-income-api';
import { Routes } from '@/lib/routes';
import {
    fetchCurrentPosSession,
    fetchPosOrders,
    fetchPosSessionSummary,
    formatOrderNumber,
    formatPosDateTime,
    personName,
    toAmount,
    type PosOrder,
    type PosOrderStatus,
} from '@/lib/pos-api';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type StatusFilter = 'all' | PosOrderStatus;

const PER_PAGE = 10;

export default function PosSessionDetailPage() {
    const t = useTranslations('pos');
    const tOrders = useTranslations('pos.orders');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const sessionId = params.id;
    const router = useRouter();
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<StatusFilter>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { openModal, modalPortal } = useModal({ closeCallBack: () => setSelectedId(null) });
    const { openModal: openSalesDetails, modalPortal: salesDetailsPortal } = useModal();

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['pos-session-summary', sessionId],
        queryFn: () => fetchPosSessionSummary(sessionId),
    });

    const { data: currentSession } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['pos-orders', 'session', sessionId, page, searchValue, status],
        queryFn: () =>
            fetchPosOrders({
                sessionId,
                page,
                perPage: PER_PAGE,
                search: searchValue || undefined,
                status: status === 'all' ? undefined : status,
            }),
    });

    const session = summary?.session;
    const isClosed = session?.status === 'CLOSED';
    const difference = toAmount(session?.difference);
    const paymentsTotal = summary ? summary.cashPayments : 0;

    const columns = useMemo(
        (): ITableColumn<PosOrder>[] => [
            {
                headerElement: {
                    value: 'number',
                    label: tOrders('number'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell mainText={formatOrderNumber(row.number)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: t('sessions.date'),
                    mobile: 'secondary',
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell mainText={formatPosDateTime(row.createdAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'creditClient',
                    label: tOrders('client'),
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell mainText={row.creditClient ? personName(row.creditClient) : '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'cashier',
                    label: tOrders('cashier'),
                    render: (_: unknown, row: PosOrder) => <OrganismTable.Cell mainText={personName(row.cashier)} />,
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: tOrders('total'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosOrder) => (
                        <OrganismTable.Cell mainText={formatMoney(toAmount(row.total))} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tOrders('status'),
                    render: (_: unknown, row: PosOrder) => (
                        <Badge
                            id={`pos-order-row-status-${row.id}`}
                            text={row.status === 'REFUND' ? tOrders('statusRefund') : tOrders('statusPaid')}
                            type={row.status === 'REFUND' ? EBadgeType.warning : EBadgeType.success}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tOrders],
    );

    const statusOptions = [
        { value: 'all', label: tOrders('allStatuses') },
        { value: 'PAID', label: tOrders('statusPaid') },
        { value: 'REFUND', label: tOrders('statusRefund') },
    ];

    const pipelineSteps = [
        { key: 'OPEN', label: t('session.statusOpen') },
        { key: 'CLOSED', label: t('session.statusClosed') },
    ];

    const scrollToOrders = () => document.getElementById('pos-session-orders')?.scrollIntoView({ behavior: 'smooth' });

    const backButton = (
        <Button
            id="pos-session-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.sessions)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    return (
        <>
            {modalPortal(
                selectedId ? <PosOrderDetailModal orderId={selectedId} canRefund={!!currentSession} /> : null,
            )}
            {salesDetailsPortal(session ? <PosSalesDetailsModal session={session} /> : null)}
            <LayoutWrapper
                title={t('sessions.title')}
                subTitle={session ? t('sessions.detailTitle', { number: session.number }) : '…'}
                leftActions={backButton}
                mainSection={
                    summaryLoading || !summary || !session ? (
                        <Div className="flex min-h-48 items-center justify-center py-16">
                            <Spinner color="text-primary-500" size={ESize.lg} />
                        </Div>
                    ) : (
                        <Div className="space-y-6">
                            <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <Div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                                    <PosStatusPipeline steps={pipelineSteps} active={session.status} />
                                </Div>

                                <Div className="flex flex-col justify-end border-b border-gray-100 sm:flex-row">
                                    <PosStatButton
                                        icon={IconComponentsEnum.shoppingCart}
                                        value={String(summary.ordersCount)}
                                        label={t('sessions.orders')}
                                        onClick={scrollToOrders}
                                    />
                                    <PosStatButton
                                        icon={IconComponentsEnum.layers}
                                        value={formatMoney(paymentsTotal)}
                                        label={t('sessions.payments')}
                                    />
                                    <PosStatButton
                                        icon={IconComponentsEnum.filetext}
                                        value={formatMoney(summary.ordersTotal)}
                                        label={t('sessions.salesDetails')}
                                        onClick={openSalesDetails}
                                    />
                                </Div>

                                <Div className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
                                    <Label variant={EVariantLabel.h3} color="text-gray-900">
                                        {t('sessions.detailTitle', { number: session.number })}
                                    </Label>

                                    <Div className="grid gap-x-10 gap-y-1 lg:grid-cols-2">
                                        <Div>
                                            <PosInfoRow
                                                label={t('sessions.openedByLabel')}
                                                value={personName(session.openedBy)}
                                            />
                                            <PosInfoRow
                                                label={t('sessions.openingDate')}
                                                value={formatPosDateTime(session.openedAt)}
                                            />
                                            <PosInfoRow
                                                label={t('sessions.closingDate')}
                                                value={isClosed ? formatPosDateTime(session.closedAt) : '—'}
                                            />
                                            {isClosed ? (
                                                <PosInfoRow
                                                    label={t('sessions.closedByLabel')}
                                                    value={personName(session.closedBy)}
                                                />
                                            ) : null}
                                        </Div>
                                        <Div>
                                            <PosInfoRow
                                                label={t('sessions.openingBalance')}
                                                value={formatMoney(summary.openingCash)}
                                            />
                                            <PosInfoRow
                                                label={t('dashboard.expectedCash')}
                                                value={formatMoney(summary.expectedCash)}
                                            />
                                            <PosInfoRow
                                                label={t('sessions.closingBalance')}
                                                value={isClosed ? formatMoney(toAmount(session.countedCash)) : '—'}
                                            />
                                            <PosInfoRow
                                                label={t('session.difference')}
                                                value={isClosed ? formatMoney(difference) : '—'}
                                                valueColor={
                                                    !isClosed || difference === 0
                                                        ? 'text-gray-900'
                                                        : difference < 0
                                                          ? 'text-danger-600'
                                                          : 'text-success-700'
                                                }
                                            />
                                        </Div>
                                    </Div>

                                    {session.closingNote ? (
                                        <Label variant={EVariantLabel.caption} color="text-gray-600" className="block italic">
                                            {session.closingNote}
                                        </Label>
                                    ) : null}
                                </Div>
                            </Div>

                            <Div id="pos-session-orders" className="space-y-3">
                                <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Label variant={EVariantLabel.h6} color="text-gray-900">
                                        {t('sessions.orders')}
                                    </Label>
                                    <Dropdown
                                        leftIcon="filter"
                                        options={statusOptions}
                                        value={status}
                                        onChange={(value) => {
                                            if (value === 'all' || value === 'PAID' || value === 'REFUND') {
                                                setStatus(value);
                                                setPage(1);
                                            }
                                        }}
                                        containerClassName="w-full sm:w-56"
                                    />
                                </Div>
                                <OrganismTable<PosOrder>
                                    columns={columns}
                                    rows={data?.data ?? []}
                                    pageSize={PER_PAGE}
                                    searchable
                                    searchValue={searchValue}
                                    onSearchChange={(value) => {
                                        setSearchValue(value);
                                        setPage(1);
                                    }}
                                    placeholder={tOrders('searchPlaceholder')}
                                    isLoading={isLoading}
                                    emptyMessage={tOrders('empty')}
                                    page={page}
                                    totalRows={data?.meta?.total ?? 0}
                                    onPageChange={setPage}
                                    onClickRow={(row) => {
                                        setSelectedId(row.id);
                                        openModal();
                                    }}
                                />
                            </Div>
                        </Div>
                    )
                }
            />
        </>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Tabs from '@/components/Primitives/Tabs/Tabs';
import Div from '@/components/Primitives/Div/Div';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    fetchDeletedReservations,
    hardDeleteReservation,
    restoreReservation,
    formatMoney,
    type ReservationRecord,
} from '@/lib/reservation-api';
import { mapReservationConflictMessage } from '@/lib/reservation-conflicts';
import {
    fetchDeletedProfessors,
    hardDeleteProfessor,
    restoreProfessor,
    type ProfessorRecord,
} from '@/lib/professor-api';
import {
    fetchDeletedRooms,
    hardDeleteRoom,
    restoreRoom,
    type RoomRecord,
} from '@/lib/room-api';
import {
    fetchDeletedCreditClients,
    hardDeleteCreditClient,
    restoreCreditClient,
    type CreditClientListItem,
} from '@/lib/credit-api';
import {
    fetchDeletedPosProducts,
    hardDeletePosProduct,
    restorePosProduct,
    type PosProduct,
    fetchDeletedInvoices,
    hardDeleteInvoice,
    restoreInvoice,
    type Invoice,
    fetchDeletedSaleOrders,
    hardDeleteSaleOrder,
    restoreSaleOrder,
    type SaleOrder,
    fetchDeletedSubscriptions,
    hardDeleteSubscription,
    restoreSubscription,
    type Subscription,
} from '@/lib/pos-api';
import {
    fetchDeletedNewsletters,
    hardDeleteNewsletter,
    restoreNewsletter,
    type NewsletterRecord,
} from '@/lib/newsletter-api';
import {
    ITableAction,
    ITableColumn,
} from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';
import { EToastType, IconComponentsEnum } from '@/Enum/Enum';

type BinTab =
    | 'reservations'
    | 'professors'
    | 'rooms'
    | 'clients'
    | 'products'
    | 'invoices'
    | 'quotes'
    | 'subscriptions'
    | 'newsletters';

type ConfirmStateType =
    | 'restore-reservation'
    | 'hard-reservation'
    | 'restore-professor'
    | 'hard-professor'
    | 'restore-room'
    | 'hard-room'
    | 'restore-client'
    | 'hard-client'
    | 'restore-product'
    | 'hard-product'
    | 'restore-invoice'
    | 'hard-invoice'
    | 'restore-quote'
    | 'hard-quote'
    | 'restore-subscription'
    | 'hard-subscription'
    | 'restore-newsletter'
    | 'hard-newsletter';

type ConfirmState = { type: ConfirmStateType; id: string } | null;

type DeletedReservation = ReservationRecord & { deletedAt?: string | null };
type DeletedProfessor = ProfessorRecord & { deletedAt?: string | null };

function formatDateTime(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function formatDateOnly(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        dateStyle: 'short',
    });
}

export default function RecycleBinPage() {
    const t = useTranslations('admin.recycleBin');
    const tCommon = useTranslations('common');
    const tPay = useTranslations('admin.reservations');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    const [tab, setTab] = useState<BinTab>('reservations');
    const [page, setPage] = useState(1);
    const [confirmState, setConfirmState] = useState<ConfirmState>(null);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setConfirmState(null),
    });

    useEffect(() => {
        if (!isAdmin) router.replace(Routes.Today);
    }, [isAdmin, router]);

    useEffect(() => {
        setPage(1);
    }, [tab]);

    // Queries
    const reservationsQuery = useQuery({
        queryKey: ['recycle-bin-reservations', page],
        queryFn: () =>
            fetchDeletedReservations({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'reservations',
    });

    const professorsQuery = useQuery({
        queryKey: ['recycle-bin-professors', page],
        queryFn: () =>
            fetchDeletedProfessors({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'professors',
    });

    const roomsQuery = useQuery({
        queryKey: ['recycle-bin-rooms', page],
        queryFn: () =>
            fetchDeletedRooms({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'rooms',
    });

    const clientsQuery = useQuery({
        queryKey: ['recycle-bin-clients', page],
        queryFn: () =>
            fetchDeletedCreditClients({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'clients',
    });

    const productsQuery = useQuery({
        queryKey: ['recycle-bin-products', page],
        queryFn: () =>
            fetchDeletedPosProducts({
                page,
                perPage: 20,
                sortBy: 'deletedAt',
                sortOrder: 'desc',
            }),
        enabled: isAdmin && tab === 'products',
    });

    const invoicesQuery = useQuery({
        queryKey: ['recycle-bin-invoices', page],
        queryFn: () =>
            fetchDeletedInvoices({
                page,
                perPage: 20,
            }),
        enabled: isAdmin && tab === 'invoices',
    });

    const quotesQuery = useQuery({
        queryKey: ['recycle-bin-quotes', page],
        queryFn: () =>
            fetchDeletedSaleOrders({
                page,
                perPage: 20,
            }),
        enabled: isAdmin && tab === 'quotes',
    });

    const subscriptionsQuery = useQuery({
        queryKey: ['recycle-bin-subscriptions', page],
        queryFn: () =>
            fetchDeletedSubscriptions({
                page,
                perPage: 20,
            }),
        enabled: isAdmin && tab === 'subscriptions',
    });

    const newslettersQuery = useQuery({
        queryKey: ['recycle-bin-newsletters', page],
        queryFn: () =>
            fetchDeletedNewsletters({
                page,
                perPage: 20,
            }),
        enabled: isAdmin && tab === 'newsletters',
    });

    // Helper to build mutations
    const createItemMutations = (
        entityKey: string,
        relatedKeys: string[],
        restoreFn: (id: string) => Promise<unknown>,
        hardDeleteFn: (id: string) => Promise<unknown>,
        conflictHandler?: (err: Error) => string,
    ) => {
        const restoreMutation = useMutation({
            mutationFn: restoreFn,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [entityKey] });
                relatedKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
                openToast(tCommon('success'), t('restored'), { type: EToastType.SUCCESS });
                setConfirmState(null);
                closeModal();
            },
            onError: (error: Error) => {
                const message = conflictHandler ? conflictHandler(error) : error.message;
                openToast(tCommon('error'), message, { type: EToastType.ERROR });
            },
        });

        const hardMutation = useMutation({
            mutationFn: hardDeleteFn,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [entityKey] });
                relatedKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
                openToast(tCommon('success'), t('hardDeleted'), { type: EToastType.SUCCESS });
                setConfirmState(null);
                closeModal();
            },
            onError: (error: Error) => {
                openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
            },
        });

        return { restoreMutation, hardMutation };
    };

    const { restoreMutation: restoreReservationMutation, hardMutation: hardReservationMutation } =
        createItemMutations(
            'recycle-bin-reservations',
            ['reservations', 'calendar'],
            restoreReservation,
            hardDeleteReservation,
            (err) => mapReservationConflictMessage(err.message, tPay),
        );

    const { restoreMutation: restoreProfessorMutation, hardMutation: hardProfessorMutation } =
        createItemMutations(
            'recycle-bin-professors',
            ['professors', 'professors-options'],
            restoreProfessor,
            hardDeleteProfessor,
        );

    const { restoreMutation: restoreRoomMutation, hardMutation: hardRoomMutation } =
        createItemMutations(
            'recycle-bin-rooms',
            ['rooms', 'rooms-options'],
            restoreRoom,
            hardDeleteRoom,
        );

    const { restoreMutation: restoreClientMutation, hardMutation: hardClientMutation } =
        createItemMutations(
            'recycle-bin-clients',
            ['credit-clients', 'credit-client', 'clients-options'],
            restoreCreditClient,
            hardDeleteCreditClient,
        );

    const { restoreMutation: restoreProductMutation, hardMutation: hardProductMutation } =
        createItemMutations(
            'recycle-bin-products',
            ['pos-products', 'pos-catalog'],
            restorePosProduct,
            hardDeletePosProduct,
        );

    const { restoreMutation: restoreInvoiceMutation, hardMutation: hardInvoiceMutation } =
        createItemMutations(
            'recycle-bin-invoices',
            ['pos-invoices'],
            restoreInvoice,
            hardDeleteInvoice,
        );

    const { restoreMutation: restoreQuoteMutation, hardMutation: hardQuoteMutation } =
        createItemMutations(
            'recycle-bin-quotes',
            ['pos-sale-orders'],
            restoreSaleOrder,
            hardDeleteSaleOrder,
        );

    const { restoreMutation: restoreSubscriptionMutation, hardMutation: hardSubscriptionMutation } =
        createItemMutations(
            'recycle-bin-subscriptions',
            ['pos-subscriptions'],
            restoreSubscription,
            hardDeleteSubscription,
        );

    const { restoreMutation: restoreNewsletterMutation, hardMutation: hardNewsletterMutation } =
        createItemMutations(
            'recycle-bin-newsletters',
            ['newsletters'],
            restoreNewsletter,
            hardDeleteNewsletter,
        );

    const tabOptions = useMemo(
        () => [
            { value: 'reservations', label: t('tabs.reservations') },
            { value: 'professors', label: t('tabs.professors') },
            { value: 'rooms', label: t('tabs.rooms') },
            { value: 'clients', label: t('tabs.clients') },
            { value: 'products', label: t('tabs.products') },
            { value: 'invoices', label: t('tabs.invoices') },
            { value: 'quotes', label: t('tabs.quotes') },
            { value: 'subscriptions', label: t('tabs.subscriptions') },
            { value: 'newsletters', label: t('tabs.newsletters') },
        ],
        [t],
    );

    // Columns
    const reservationColumns = useMemo(
        (): ITableColumn<DeletedReservation>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell
                            mainText={formatDateTime(row.deletedAt ?? row.updatedAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'room',
                    label: tPay('room'),
                    mobile: 'primary',
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={row.room?.name ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'professor',
                    label: tPay('professor'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell
                            mainText={
                                row.professor
                                    ? `${row.professor.firstName} ${row.professor.lastName}`
                                    : '—'
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'startAt',
                    label: tPay('startAt'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.startAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: tPay('price'),
                    render: (_: unknown, row: DeletedReservation) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
        ],
        [t, tPay],
    );

    const professorColumns = useMemo(
        (): ITableColumn<DeletedProfessor>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell
                            mainText={formatDateTime(row.deletedAt ?? row.updatedAt)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'name',
                    label: t('columns.name'),
                    mobile: 'primary',
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell
                            mainText={`${row.firstName} ${row.lastName}`.trim()}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: tCommon('email'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell mainText={row.email ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'specialty',
                    label: t('columns.specialty'),
                    render: (_: unknown, row: DeletedProfessor) => (
                        <OrganismTable.Cell mainText={row.specialty ?? '—'} />
                    ),
                },
            },
        ],
        [t, tCommon],
    );

    const roomColumns = useMemo(
        (): ITableColumn<RoomRecord>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt ?? row.updatedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'name',
                    label: t('columns.name'),
                    mobile: 'primary',
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={row.name} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'capacity',
                    label: t('columns.capacity'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={String(row.capacity)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'pricePerHour',
                    label: t('columns.pricePerHour'),
                    render: (_: unknown, row: RoomRecord) => (
                        <OrganismTable.Cell mainText={formatMoney(row.pricePerHour)} />
                    ),
                },
            },
        ],
        [t],
    );

    const clientColumns = useMemo(
        (): ITableColumn<CreditClientListItem>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt ?? row.updatedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'name',
                    label: t('columns.name'),
                    mobile: 'primary',
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={`${row.firstName} ${row.lastName}`.trim()} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'phone',
                    label: t('columns.phone'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={row.phone ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: t('columns.email'),
                    render: (_: unknown, row: CreditClientListItem) => (
                        <OrganismTable.Cell mainText={row.email ?? '—'} />
                    ),
                },
            },
        ],
        [t],
    );

    const productColumns = useMemo(
        (): ITableColumn<PosProduct>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: PosProduct) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'name',
                    label: t('columns.name'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosProduct) => (
                        <OrganismTable.Cell mainText={row.name} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'category',
                    label: t('columns.type'),
                    render: (_: unknown, row: PosProduct) => (
                        <OrganismTable.Cell mainText={row.category?.name ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: t('columns.price'),
                    render: (_: unknown, row: PosProduct) => (
                        <OrganismTable.Cell mainText={formatMoney(row.price)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'type',
                    label: t('columns.status'),
                    render: (_: unknown, row: PosProduct) => (
                        <OrganismTable.Cell mainText={row.type} />
                    ),
                },
            },
        ],
        [t],
    );

    const invoiceColumns = useMemo(
        (): ITableColumn<Invoice>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'number',
                    label: t('columns.number'),
                    mobile: 'primary',
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={row.displayNumber || (row.sequence ? `#${row.sequence}` : '—')} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'type',
                    label: t('columns.type'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={row.type === 'CREDIT_NOTE' ? 'Avoir' : 'Facture'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'client',
                    label: t('columns.client'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell
                            mainText={row.client ? `${row.client.firstName} ${row.client.lastName}` : '—'}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('columns.total'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={formatMoney(row.total)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('columns.status'),
                    render: (_: unknown, row: Invoice) => (
                        <OrganismTable.Cell mainText={row.status} />
                    ),
                },
            },
        ],
        [t],
    );

    const quoteColumns = useMemo(
        (): ITableColumn<SaleOrder>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'number',
                    label: t('columns.number'),
                    mobile: 'primary',
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={`#${row.number}`} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'client',
                    label: t('columns.client'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell
                            mainText={row.client ? `${row.client.firstName} ${row.client.lastName}` : '—'}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('columns.total'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={formatMoney(row.total)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('columns.status'),
                    render: (_: unknown, row: SaleOrder) => (
                        <OrganismTable.Cell mainText={row.status} />
                    ),
                },
            },
        ],
        [t],
    );

    const subscriptionColumns = useMemo(
        (): ITableColumn<Subscription>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'number',
                    label: t('columns.number'),
                    mobile: 'primary',
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={`#${row.number}`} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'productName',
                    label: t('columns.name'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={row.productName} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'client',
                    label: t('columns.client'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell
                            mainText={row.client ? `${row.client.firstName} ${row.client.lastName}` : '—'}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'period',
                    label: t('columns.period'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell
                            mainText={`${formatDateOnly(row.startDate)} - ${formatDateOnly(row.endDate)}`}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'total',
                    label: t('columns.total'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={formatMoney(row.total)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('columns.status'),
                    render: (_: unknown, row: Subscription) => (
                        <OrganismTable.Cell mainText={row.status} />
                    ),
                },
            },
        ],
        [t],
    );

    const newsletterColumns = useMemo(
        (): ITableColumn<NewsletterRecord>[] => [
            {
                headerElement: {
                    value: 'deletedAt',
                    label: t('columns.deletedAt'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={formatDateTime(row.deletedAt)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'subject',
                    label: t('columns.subject'),
                    mobile: 'primary',
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={row.subject} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'category',
                    label: t('columns.type'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={row.category} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'audience',
                    label: t('columns.audience'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={row.audience} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('columns.status'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={row.status} />
                    ),
                },
            },
        ],
        [t],
    );

    // Generic Action Generator
    const createActions = <T extends { id: string }>(
        restoreType: ConfirmStateType,
        hardType: ConfirmStateType,
    ): ITableAction<T>[] => [
        {
            label: t('restore'),
            iconName: IconComponentsEnum.check,
            onClick: (row) => {
                setConfirmState({ type: restoreType, id: row.id });
                openModal();
            },
        },
        {
            label: t('hardDelete'),
            iconName: IconComponentsEnum.trash,
            onClick: (row) => {
                setConfirmState({ type: hardType, id: row.id });
                openModal();
            },
        },
    ];

    const reservationActions = useMemo(
        () => createActions<DeletedReservation>('restore-reservation', 'hard-reservation'),
        [openModal, t],
    );

    const professorActions = useMemo(
        () => createActions<DeletedProfessor>('restore-professor', 'hard-professor'),
        [openModal, t],
    );

    const roomActions = useMemo(
        () => createActions<RoomRecord>('restore-room', 'hard-room'),
        [openModal, t],
    );

    const clientActions = useMemo(
        () => createActions<CreditClientListItem>('restore-client', 'hard-client'),
        [openModal, t],
    );

    const productActions = useMemo(
        () => createActions<PosProduct>('restore-product', 'hard-product'),
        [openModal, t],
    );

    const invoiceActions = useMemo(
        () => createActions<Invoice>('restore-invoice', 'hard-invoice'),
        [openModal, t],
    );

    const quoteActions = useMemo(
        () => createActions<SaleOrder>('restore-quote', 'hard-quote'),
        [openModal, t],
    );

    const subscriptionActions = useMemo(
        () => createActions<Subscription>('restore-subscription', 'hard-subscription'),
        [openModal, t],
    );

    const newsletterActions = useMemo(
        () => createActions<NewsletterRecord>('restore-newsletter', 'hard-newsletter'),
        [openModal, t],
    );

    const isConfirmLoading =
        restoreReservationMutation.isPending ||
        hardReservationMutation.isPending ||
        restoreProfessorMutation.isPending ||
        hardProfessorMutation.isPending ||
        restoreRoomMutation.isPending ||
        hardRoomMutation.isPending ||
        restoreClientMutation.isPending ||
        hardClientMutation.isPending ||
        restoreProductMutation.isPending ||
        hardProductMutation.isPending ||
        restoreInvoiceMutation.isPending ||
        hardInvoiceMutation.isPending ||
        restoreQuoteMutation.isPending ||
        hardQuoteMutation.isPending ||
        restoreSubscriptionMutation.isPending ||
        hardSubscriptionMutation.isPending ||
        restoreNewsletterMutation.isPending ||
        hardNewsletterMutation.isPending;

    const isRestore = Boolean(confirmState?.type.startsWith('restore'));

    if (!isAdmin) return null;

    return (
        <>
            {modalPortal(
                confirmState ? (
                    <ConfirmationModal
                        title={isRestore ? t('restore') : t('hardDelete')}
                        description={
                            isRestore ? t('confirmRestore') : t('confirmHardDelete')
                        }
                        submitBtnText={isRestore ? t('restore') : t('hardDelete')}
                        cancelBtnText={tCommon('cancel')}
                        isLoading={isConfirmLoading}
                        icon={isRestore ? IconComponentsEnum.check : IconComponentsEnum.trash}
                        iconBgColor={isRestore ? 'bg-success-100' : 'bg-danger-100'}
                        iconColor={isRestore ? 'text-success-700' : 'text-danger-600'}
                        onSubmit={() => {
                            if (!confirmState) return;
                            switch (confirmState.type) {
                                case 'restore-reservation':
                                    restoreReservationMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-reservation':
                                    hardReservationMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-professor':
                                    restoreProfessorMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-professor':
                                    hardProfessorMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-room':
                                    restoreRoomMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-room':
                                    hardRoomMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-client':
                                    restoreClientMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-client':
                                    hardClientMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-product':
                                    restoreProductMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-product':
                                    hardProductMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-invoice':
                                    restoreInvoiceMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-invoice':
                                    hardInvoiceMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-quote':
                                    restoreQuoteMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-quote':
                                    hardQuoteMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-subscription':
                                    restoreSubscriptionMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-subscription':
                                    hardSubscriptionMutation.mutate(confirmState.id);
                                    break;
                                case 'restore-newsletter':
                                    restoreNewsletterMutation.mutate(confirmState.id);
                                    break;
                                case 'hard-newsletter':
                                    hardNewsletterMutation.mutate(confirmState.id);
                                    break;
                            }
                        }}
                    />
                ) : null,
            )}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <Div className="space-y-4">
                        <Tabs
                            options={tabOptions}
                            value={tab}
                            onChange={(value) => {
                                setTab(value as BinTab);
                            }}
                            variant="pills"
                        />
                        {tab === 'reservations' && (
                            <OrganismTable<DeletedReservation>
                                columns={reservationColumns}
                                rows={reservationsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={reservationsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={reservationActions}
                                isLoading={reservationsQuery.isLoading}
                                emptyMessage={t('emptyReservations')}
                            />
                        )}
                        {tab === 'professors' && (
                            <OrganismTable<DeletedProfessor>
                                columns={professorColumns}
                                rows={professorsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={professorsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={professorActions}
                                isLoading={professorsQuery.isLoading}
                                emptyMessage={t('emptyProfessors')}
                            />
                        )}
                        {tab === 'rooms' && (
                            <OrganismTable<RoomRecord>
                                columns={roomColumns}
                                rows={roomsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={roomsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={roomActions}
                                isLoading={roomsQuery.isLoading}
                                emptyMessage={t('emptyRooms')}
                            />
                        )}
                        {tab === 'clients' && (
                            <OrganismTable<CreditClientListItem>
                                columns={clientColumns}
                                rows={clientsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={clientsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={clientActions}
                                isLoading={clientsQuery.isLoading}
                                emptyMessage={t('emptyClients')}
                            />
                        )}
                        {tab === 'products' && (
                            <OrganismTable<PosProduct>
                                columns={productColumns}
                                rows={productsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={productsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={productActions}
                                isLoading={productsQuery.isLoading}
                                emptyMessage={t('emptyProducts')}
                            />
                        )}
                        {tab === 'invoices' && (
                            <OrganismTable<Invoice>
                                columns={invoiceColumns}
                                rows={invoicesQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={invoicesQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={invoiceActions}
                                isLoading={invoicesQuery.isLoading}
                                emptyMessage={t('emptyInvoices')}
                            />
                        )}
                        {tab === 'quotes' && (
                            <OrganismTable<SaleOrder>
                                columns={quoteColumns}
                                rows={quotesQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={quotesQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={quoteActions}
                                isLoading={quotesQuery.isLoading}
                                emptyMessage={t('emptyQuotes')}
                            />
                        )}
                        {tab === 'subscriptions' && (
                            <OrganismTable<Subscription>
                                columns={subscriptionColumns}
                                rows={subscriptionsQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={subscriptionsQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={subscriptionActions}
                                isLoading={subscriptionsQuery.isLoading}
                                emptyMessage={t('emptySubscriptions')}
                            />
                        )}
                        {tab === 'newsletters' && (
                            <OrganismTable<NewsletterRecord>
                                columns={newsletterColumns}
                                rows={newslettersQuery.data?.data ?? []}
                                pageSize={20}
                                page={page}
                                totalRows={newslettersQuery.data?.meta.total ?? 0}
                                onPageChange={setPage}
                                actions={newsletterActions}
                                isLoading={newslettersQuery.isLoading}
                                emptyMessage={t('emptyNewsletters')}
                            />
                        )}
                    </Div>
                }
            />
        </>
    );
}

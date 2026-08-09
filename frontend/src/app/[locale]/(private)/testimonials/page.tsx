'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import StarRating from '@/components/Primitives/StarRating/StarRating';
import { EBadgeSize, EBadgeType, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import {
    fetchTestimonials,
    updateTestimonialStatus,
    deleteTestimonial,
    type TestimonialRecord,
    type TestimonialStatus,
} from '@/lib/testimonial-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import TestimonialFilterModal from '@/components/Modals/TestimonialFilterModal/TestimonialFilterModal';
import Badge from '@/components/Primitives/Badge/Badge';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const MAX_DESCRIPTION = 80;

function truncate(text: string): string {
    const t = text.trim();
    if (t.length <= MAX_DESCRIPTION) return t;
    return `${t.slice(0, MAX_DESCRIPTION)}…`;
}

function statusColor(status: TestimonialStatus): EBadgeType {
    switch (status) {
        case 'APPROVED':
            return EBadgeType.success;
        case 'REJECTED':
            return EBadgeType.error;
        default:
            return EBadgeType.warning;
    }
}

type ModalState =
    | { type: 'filter' }
    | { type: 'status'; testimonial: TestimonialRecord; status: 'APPROVED' | 'REJECTED' }
    | { type: 'delete'; testimonial: TestimonialRecord }
    | null;

export default function TestimonialsAdminPage() {
    const t = useTranslations('admin.testimonials');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const statusLabel = useCallback(
        (status: TestimonialStatus): string => {
            switch (status) {
                case 'APPROVED':
                    return tStatus('published');
                case 'REJECTED':
                    return tStatus('rejected');
                default:
                    return tStatus('pending');
            }
        },
        [tStatus],
    );

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState<TestimonialStatus | undefined>();
    const [modalState, setModalState] = useState<ModalState>(null);

    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const openFilterDrawer = useCallback(() => {
        setModalState({ type: 'filter' });
        openModal();
    }, [openModal]);

    const { data, isLoading } = useQuery({
        queryKey: ['testimonials', page, searchValue, sortBy, sortOrder, statusFilter],
        queryFn: () =>
            fetchTestimonials({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
                status: statusFilter,
            }),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
            updateTestimonialStatus(id, status),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            queryClient.invalidateQueries({ queryKey: ['public-testimonials'] });
            openToast(
                tCommon('success'),
                vars.status === 'APPROVED' ? t('approve') : t('reject'),
                { type: EToastType.SUCCESS },
            );
            closeModal();
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTestimonial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            queryClient.invalidateQueries({ queryKey: ['public-testimonials'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const filterTags = useMemo(() => {
        if (!statusFilter) return [];
        return [`${tCommon('status')}: ${statusLabel(statusFilter)}`];
    }, [statusFilter, statusLabel, tCommon]);

    const columns = useMemo(
        (): ITableColumn<TestimonialRecord>[] => [
            {
                headerElement: {
                    value: 'firstName',
                    label: tCommon('name'),
                    sortable: true,
                    width: '160px',
                    render: (_: unknown, row: TestimonialRecord) => (
                        <OrganismTable.Cell mainText={`${row.firstName} ${row.lastName}`} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: tCommon('email'),
                    sortable: true,
                    render: (val: string) => <OrganismTable.Cell mainText={val} />,
                },
            },
            {
                headerElement: {
                    value: 'title',
                    label: t('columns.title'),
                    sortable: true,
                    render: (val: string) => <OrganismTable.Cell mainText={val} />,
                },
            },
            {
                headerElement: {
                    value: 'description',
                    label: t('columns.testimonial'),
                    render: (val: string) => <OrganismTable.Cell mainText={truncate(val)} />,
                },
            },
            {
                headerElement: {
                    value: 'rating',
                    label: t('columns.rating'),
                    sortable: true,
                    render: (val: number) => <StarRating value={val} readonly size="sm" />,
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: tCommon('status'),
                    sortable: true,
                    render: (val: TestimonialStatus) => (
                        <Badge
                            id={`testimonial-status-${val}`}
                            text={statusLabel(val)}
                            type={statusColor(val)}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tCommon, statusLabel],
    );

    const actions: ITableAction<TestimonialRecord>[] = useMemo(
        () => [
            {
                label: t('approve'),
                iconName: IconComponentsEnum.check,
                onClick: (row) => {
                    setModalState({ type: 'status', testimonial: row, status: 'APPROVED' });
                    openModal();
                },
                isVisible: (row) => row.status !== 'APPROVED',
            },
            {
                label: t('reject'),
                iconName: IconComponentsEnum.close,
                onClick: (row) => {
                    setModalState({ type: 'status', testimonial: row, status: 'REJECTED' });
                    openModal();
                },
                isVisible: (row) => row.status !== 'REJECTED',
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', testimonial: row });
                    openModal();
                },
            },
        ],
        [openModal, t, tCommon],
    );

    const renderModal = () => {
        if (!modalState) return null;

        if (modalState.type === 'filter') {
            return (
                <TestimonialFilterModal
                    status={statusFilter}
                    onApply={(s) => {
                        setStatusFilter(s);
                        setPage(1);
                        closeModal();
                        setModalState(null);
                    }}
                    onReset={() => {
                        setStatusFilter(undefined);
                        setPage(1);
                        closeModal();
                        setModalState(null);
                    }}
                />
            );
        }

        if (modalState.type === 'status') {
            const isApprove = modalState.status === 'APPROVED';
            return (
                <ConfirmationModal
                    title={isApprove ? t('approve') : t('reject')}
                    description={tCommon('confirm')}
                    submitBtnText={isApprove ? t('approve') : t('reject')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() =>
                        statusMutation.mutate({
                            id: modalState.testimonial.id,
                            status: modalState.status,
                        })
                    }
                    isLoading={statusMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-primary-100"
                    iconColor="text-primary-500"
                />
            );
        }

        return (
            <ConfirmationModal
                title={tCommon('delete')}
                description={tCommon('confirm')}
                submitBtnText={tCommon('delete')}
                cancelBtnText={tCommon('cancel')}
                onSubmit={() => deleteMutation.mutate(modalState.testimonial.id)}
                isLoading={deleteMutation.isPending}
                icon={IconComponentsEnum.info}
                iconBgColor="bg-danger-100"
                iconColor="text-danger-600"
            />
        );
    };

    return (
        <>
            {modalState && modalPortal(renderModal())}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <OrganismTable<TestimonialRecord>
                        columns={columns}
                        rows={rows}
                        pageSize={10}
                        searchable
                        searchValue={searchValue}
                        onSearchChange={(v) => {
                            setSearchValue(v);
                            setPage(1);
                        }}
                        filterTags={filterTags}
                        placeholder={tCommon('search')}
                        onRemoveTag={(tag) => {
                            if (tag.startsWith(`${tCommon('status')}:`)) {
                                setStatusFilter(undefined);
                            }
                            setPage(1);
                        }}
                        onReset={() => {
                            setStatusFilter(undefined);
                            setPage(1);
                        }}
                        onClickFilter={openFilterDrawer}
                        actions={actions}
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
                }
            />
        </>
    );
}

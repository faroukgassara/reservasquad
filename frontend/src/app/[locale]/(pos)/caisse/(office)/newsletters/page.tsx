'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    deleteNewsletter,
    fetchNewsletters,
    type NewsletterAudience,
    type NewsletterCategory,
    type NewsletterRecord,
    type NewsletterStatus,
} from '@/lib/newsletter-api';
import { Routes } from '@/lib/routes';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const PER_PAGE = 10;

function formatShortDate(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PosNewslettersPage() {
    const t = useTranslations('pos.newsletters');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    useEffect(() => {
        if (sessionStatus !== 'loading' && !isAdmin) {
            router.replace(Routes.Pos.index);
        }
    }, [sessionStatus, isAdmin, router]);

    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { modalPortal, openModal, closeModal } = useModal();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['newsletters', page, search, statusFilter],
        queryFn: () =>
            fetchNewsletters({
                page,
                perPage: PER_PAGE,
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            }),
        enabled: isAdmin,
        refetchInterval: (query) => {
            const hasSending = query.state.data?.data?.some((n) => n.status === 'SENDING');
            return hasSending ? 3000 : false;
        },
    });

    if (sessionStatus === 'loading' || !isAdmin) {
        return null;
    }


    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteNewsletter(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['newsletters'] });
            openToast(tCommon('success'), t('deleteSuccess'), { type: EToastType.SUCCESS });
            closeModal();
            setDeletingId(null);
        },
        onError: (err: Error) => {
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR });
        },
    });

    const statusBadge = (status: NewsletterStatus, rowId: string) => {
        switch (status) {
            case 'DRAFT':
                return <Badge id={`newsletter-status-${rowId}`} text={t('status_DRAFT')} type={EBadgeType.revprimary} size={EBadgeSize.small} />;
            case 'SENDING':
                return <Badge id={`newsletter-status-${rowId}`} text={t('status_SENDING')} type={EBadgeType.warning} size={EBadgeSize.small} />;
            case 'SENT':
                return <Badge id={`newsletter-status-${rowId}`} text={t('status_SENT')} type={EBadgeType.success} size={EBadgeSize.small} />;
            case 'FAILED':
                return <Badge id={`newsletter-status-${rowId}`} text={t('status_FAILED')} type={EBadgeType.error} size={EBadgeSize.small} />;
            default:
                return null;
        }
    };

    const categoryBadge = (category: NewsletterCategory, rowId: string) => {
        switch (category) {
            case 'PROMOTION':
                return <Badge id={`newsletter-cat-${rowId}`} text={t('category_PROMOTION')} type={EBadgeType.warning} size={EBadgeSize.small} />;
            case 'EDITORIAL':
                return <Badge id={`newsletter-cat-${rowId}`} text={t('category_EDITORIAL')} type={EBadgeType.primary} size={EBadgeSize.small} />;
            case 'DIGEST':
                return <Badge id={`newsletter-cat-${rowId}`} text={t('category_DIGEST')} type={EBadgeType.revprimary} size={EBadgeSize.small} />;
            case 'UPDATE':
            default:
                return <Badge id={`newsletter-cat-${rowId}`} text={t('category_UPDATE')} type={EBadgeType.revprimary} size={EBadgeSize.small} />;
        }
    };

    const audienceLabel = (audience: NewsletterAudience) => {
        switch (audience) {
            case 'SPECIFIC_RECIPIENTS':
                return t('audience_SPECIFIC_RECIPIENTS');
            case 'ALL_PROFESSORS':
                return t('audience_ALL_PROFESSORS');
            case 'ACTIVE_SUBSCRIBERS':
                return t('audience_ACTIVE_SUBSCRIBERS');
            case 'EXPIRED_SUBSCRIBERS':
                return t('audience_EXPIRED_SUBSCRIBERS');
            case 'ALL_CLIENTS':
            default:
                return t('audience_ALL_CLIENTS');
        }
    };

    const columns: ITableColumn<NewsletterRecord>[] = useMemo(
        () => [
            {
                headerElement: {
                    value: 'subject',
                    label: t('table.subject'),
                    mobile: 'primary',
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell
                            mainText={row.subject}
                            supportingText={row.preheader || row.body.slice(0, 75).trim() + (row.body.length > 75 ? '…' : '')}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'category',
                    label: t('table.category'),
                    mobile: 'secondary',
                    render: (_: unknown, row: NewsletterRecord) => categoryBadge(row.category, row.id),
                },
            },
            {
                headerElement: {
                    value: 'audience',
                    label: t('table.audience'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={audienceLabel(row.audience)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('table.status'),
                    mobile: 'primary',
                    render: (_: unknown, row: NewsletterRecord) => statusBadge(row.status, row.id),
                },
            },
            {
                headerElement: {
                    value: 'progress',
                    label: t('table.progress'),
                    render: (_: unknown, row: NewsletterRecord) => {
                        if (row.status === 'DRAFT') {
                            return <OrganismTable.Cell mainText={t('table.draftRecipients', { count: row.recipientsCount || 0 })} />;
                        }
                        return (
                            <OrganismTable.Cell
                                mainText={`${row.sentCount} / ${row.recipientsCount}`}
                                supportingText={row.failedCount > 0 ? t('table.failedRecipients', { count: row.failedCount }) : undefined}
                            />
                        );
                    },
                },
            },
            {
                headerElement: {
                    value: 'date',
                    label: t('table.date'),
                    render: (_: unknown, row: NewsletterRecord) => (
                        <OrganismTable.Cell mainText={formatShortDate(row.sentAt || row.createdAt)} />
                    ),
                },
            },
        ],
        [t],
    );

    const actions = useMemo(
        (): ITableAction<NewsletterRecord>[] => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => router.push(Routes.Pos.newsletter(row.id)),
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    if (row.status !== 'DRAFT') return;
                    setDeletingId(row.id);
                    openModal();
                },
            },
        ],
        [router, openModal, tCommon],
    );

    const filterOptions = [
        { value: 'all', label: t('filter_all') },
        { value: 'DRAFT', label: t('status_DRAFT') },
        { value: 'SENDING', label: t('status_SENDING') },
        { value: 'SENT', label: t('status_SENT') },
        { value: 'FAILED', label: t('status_FAILED') },
    ];

    return (
        <>
            {modalPortal(
                <ConfirmationModal
                    title={t('deleteTitle')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => {
                        if (deletingId) deleteMutation.mutate(deletingId);
                    }}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.trash}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />,
            )}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                rightActions={
                    <Button
                        id="newsletter-new-btn"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                        text={t('new')}
                        onClick={() => router.push(Routes.Pos.newsletter('new'))}
                    />
                }
                mainSection={
                    <Div className="space-y-4">
                        <Div className="flex justify-end">
                            <Dropdown
                                leftIcon="filter"
                                options={filterOptions}
                                value={statusFilter}
                                onChange={(value) => {
                                    setStatusFilter(String(value));
                                    setPage(1);
                                }}
                                containerClassName="w-full sm:w-56"
                            />
                        </Div>

                        <OrganismTable<NewsletterRecord>
                            columns={columns}
                            actions={actions}
                            rows={data?.data ?? []}
                            pageSize={PER_PAGE}
                            searchable
                            searchValue={search}
                            onSearchChange={(value) => {
                                setSearch(value);
                                setPage(1);
                            }}
                            placeholder={t('searchPlaceholder')}
                            isLoading={isLoading}
                            emptyMessage={t('empty')}
                            page={page}
                            totalRows={data?.meta?.total ?? 0}
                            onPageChange={setPage}
                            onClickRow={(row) => router.push(Routes.Pos.newsletter(row.id))}
                        />
                    </Div>
                }
            />
        </>
    );
}

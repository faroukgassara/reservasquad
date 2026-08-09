'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { IconComponentsEnum, EToastType } from '@/Enum/Enum';
import { fetchContactMessages, deleteContactMessage, type ContactMessageRow } from '@/lib/contact-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const MAX_MESSAGE_PREVIEW = 120;

function truncateMessage(text: string): string {
    const t = text.trim();
    if (t.length <= MAX_MESSAGE_PREVIEW) return t;
    return `${t.slice(0, MAX_MESSAGE_PREVIEW)}…`;
}

export default function ContactMessagesPage() {
    const t = useTranslations('admin.contactMessages');
    const tCommon = useTranslations('common');

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [messageToDelete, setMessageToDelete] = useState<ContactMessageRow | null>(null);

    const queryClient = useQueryClient();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setMessageToDelete(null),
    });
    const { openToast } = useToast();

    const { data, isLoading } = useQuery({
        queryKey: ['contact-messages', page, searchValue, sortBy, sortOrder],
        queryFn: () =>
            fetchContactMessages({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
            }),
        enabled: true,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteContactMessage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
            setMessageToDelete(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const columns = useMemo(
        (): ITableColumn<ContactMessageRow>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: tCommon('name'),
                    sortable: true,
                    width: '180px',
                    render: (_: unknown, row: ContactMessageRow) => (
                        <OrganismTable.Cell mainText={row.name} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: tCommon('email'),
                    sortable: true,
                    width: '220px',
                    render: (_: unknown, row: ContactMessageRow) => (
                        <OrganismTable.Cell mainText={row.email} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'message',
                    label: t('message'),
                    render: (_: unknown, row: ContactMessageRow) => (
                        <OrganismTable.Cell
                            mainText={truncateMessage(row.message)}
                            supportingText={
                                row.message.length > MAX_MESSAGE_PREVIEW
                                    ? t('charCount', { count: row.message.length })
                                    : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: t('receivedAt'),
                    sortable: true,
                    width: '160px',
                    render: (val: string) => (
                        <OrganismTable.Cell
                            mainText={
                                val
                                    ? new Date(val).toLocaleString(undefined, {
                                          dateStyle: 'short',
                                          timeStyle: 'short',
                                      })
                                    : '—'
                            }
                        />
                    ),
                },
            },
        ],
        [t, tCommon],
    );

    const actions: ITableAction<ContactMessageRow>[] = [
        {
            label: tCommon('delete'),
            iconName: IconComponentsEnum.close,
            onClick: (row) => {
                setMessageToDelete(row);
                openModal();
            },
        },
    ];

    const handleConfirmDelete = () => {
        if (messageToDelete) {
            deleteMutation.mutate(messageToDelete.id);
        }
    };

    return (
        <>
            {messageToDelete &&
                modalPortal(
                    <ConfirmationModal
                        title={tCommon('delete')}
                        description={tCommon('confirm')}
                        submitBtnText={tCommon('delete')}
                        cancelBtnText={tCommon('cancel')}
                        onSubmit={handleConfirmDelete}
                        isLoading={deleteMutation.isPending}
                        icon={IconComponentsEnum.info}
                        iconBgColor="bg-danger-100"
                        iconColor="text-danger-600"
                    />
                )}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<ContactMessageRow>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(v) => {
                                setSearchValue(v);
                                setPage(1);
                            }}
                            placeholder={tCommon('search')}
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
                    </div>
                }
            />
        </>
    );
}

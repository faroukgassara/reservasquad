'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { IconComponentsEnum, EToastType } from '@/Enum/Enum';
import { ITableAction } from '@/interfaces/Molecules/IMoleculeTableAction/IMoleculeTableAction';
import { IMoleculeTableColumn } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn';
import MoleculeTableCell from '@/components/Molecules/MoleculeTableCell/MoleculeTableCell';
import {
    fetchContactMessages,
    deleteContactMessage,
    type ContactMessageRow,
} from '@/lib/contact-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';

const MAX_MESSAGE_PREVIEW = 120;

function truncateMessage(text: string): string {
    const t = text.trim();
    if (t.length <= MAX_MESSAGE_PREVIEW) return t;
    return `${t.slice(0, MAX_MESSAGE_PREVIEW)}…`;
}

export default function ContactMessagesPage() {
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
            openToast('Succès', 'Message supprimé.', { type: EToastType.SUCCESS });
            closeModal();
            setMessageToDelete(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const columns = useMemo(
        (): IMoleculeTableColumn<ContactMessageRow>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: 'Nom',
                    sortable: true,
                    width: '180px',
                    render: (_: unknown, row: ContactMessageRow) => (
                        <MoleculeTableCell mainText={row.name} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'email',
                    label: 'E-mail',
                    sortable: true,
                    width: '220px',
                    render: (_: unknown, row: ContactMessageRow) => (
                        <MoleculeTableCell mainText={row.email} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'message',
                    label: 'Message',
                    render: (_: unknown, row: ContactMessageRow) => (
                        <MoleculeTableCell
                            mainText={truncateMessage(row.message)}
                            supportingText={
                                row.message.length > MAX_MESSAGE_PREVIEW
                                    ? `${row.message.length} caractères`
                                    : undefined
                            }
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'createdAt',
                    label: 'Reçu le',
                    sortable: true,
                    width: '160px',
                    render: (val: string) => (
                        <MoleculeTableCell
                            mainText={
                                val
                                    ? new Date(val).toLocaleString('fr-FR', {
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
        []
    );

    const actions: ITableAction<ContactMessageRow>[] = [
        {
            label: 'Supprimer',
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
                        title="Supprimer le message"
                        description={`Supprimer le message de « ${messageToDelete.name} » ? Cette action est irréversible.`}
                        submitBtnText="Supprimer"
                        cancelBtnText="Annuler"
                        onSubmit={handleConfirmDelete}
                        isLoading={deleteMutation.isPending}
                        icon={IconComponentsEnum.info}
                        iconBgColor="bg-danger-100"
                        iconColor="text-danger-600"
                    />
                )}

            <LayoutWrapper
                title="Messages contact"
                subTitle="Demandes envoyées depuis la page Contact."
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<ContactMessageRow>
                            title="Liste des messages"
                            badge={`${totalRows} message${totalRows === 1 ? '' : 's'}`}
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(v) => {
                                setSearchValue(v);
                                setPage(1);
                            }}
                            placeholder="Recherche (nom, e-mail, message)"
                            actions={actions}
                            isLoading={isLoading}
                            emptyMessage="Aucun message pour le moment"
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

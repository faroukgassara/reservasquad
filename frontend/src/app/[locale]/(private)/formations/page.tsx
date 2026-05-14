'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { Button } from '@/components/Molecules';
import {
    EButtonSize,
    EButtonType,
    EBadgeColor,
    IconComponentsEnum,
    EToastType,
    ESize,
} from '@/Enum/Enum';
import { ITableAction } from '@/interfaces/Molecules/IMoleculeTableAction/IMoleculeTableAction';
import { IMoleculeTableColumn } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn';
import MoleculeTableCell from '@/components/Molecules/MoleculeTableCell/MoleculeTableCell';
import { AtomBadge } from '@/components/Atoms';
import {
    fetchFormations,
    fetchFormationCategories,
    deleteFormation,
    archiveFormation,
    unarchiveFormation,
} from '@/lib/formation-api';
import { Routes } from '@/lib/routes';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import FormationFiltersModal, {
    type FormationFilters,
} from '@/components/Modals/FormationFiltersModal/FormationFiltersModal';

interface FormationRow {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    price: number;
    status: string;
    slug: string;
    category?: { id: string; name: string } | null;
}

export default function FormationsPage() {
    const [searchValue, setSearchValue] = useState('');
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [formationToDelete, setFormationToDelete] = useState<FormationRow | null>(null);
    const [formationArchiveAction, setFormationArchiveAction] = useState<{
        formation: FormationRow;
        type: 'archive' | 'unarchive';
    } | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<FormationFilters>({});

    const queryClient = useQueryClient();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => {
            setFormationToDelete(null);
            setFormationArchiveAction(null);
        },
    });
    const { openToast } = useToast();

    const { data: categories = [] } = useQuery({
        queryKey: ['formation-categories'],
        queryFn: fetchFormationCategories,
        enabled: true,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['formations', page, searchValue, sortBy, sortOrder, filters],
        queryFn: () =>
            fetchFormations({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
                status: filters.status,
                categoryId: filters.categoryId,
                priceMin: filters.priceMin,
                priceMax: filters.priceMax,
                durationMin: filters.durationMin,
                durationMax: filters.durationMax,
            }),
        enabled: true,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteFormation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations'] });
            openToast('Succès', 'Formation supprimée avec succès.', { type: EToastType.SUCCESS });
            closeModal();
            setFormationToDelete(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (id: string) => archiveFormation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations'] });
            openToast('Succès', 'Formation archivée avec succès.', { type: EToastType.SUCCESS });
            closeModal();
            setFormationArchiveAction(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const unarchiveMutation = useMutation({
        mutationFn: (id: string) => unarchiveFormation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formations'] });
            openToast('Succès', 'Formation désarchivée avec succès.', { type: EToastType.SUCCESS });
            closeModal();
            setFormationArchiveAction(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const activeFilterTags = useMemo(() => {
        const tags: string[] = [];
        if (filters.status) {
            tags.push(`Statut: ${filters.status === 'ACTIVE' ? 'Actif' : 'Inactif'}`);
        }
        if (filters.categoryId) {
            const cat = categories.find((c) => c.id === filters.categoryId);
            tags.push(`Catégorie: ${cat?.name ?? filters.categoryId}`);
        }
        if (filters.priceMin != null || filters.priceMax != null) {
            const min = filters.priceMin ?? '';
            const max = filters.priceMax ?? '';
            tags.push(`Prix: ${min} - ${max} €`);
        }
        if (filters.durationMin != null || filters.durationMax != null) {
            const min = filters.durationMin ?? '';
            const max = filters.durationMax ?? '';
            tags.push(`Durée: ${min} - ${max} h`);
        }
        return tags;
    }, [filters, categories]);

    const columns = useMemo(
        (): IMoleculeTableColumn<FormationRow>[] => [
            {
                headerElement: {
                    value: 'title',
                    label: 'Formation',
                    sortable: true,
                    width: '220px',
                    render: (_: any, row: FormationRow) => (
                        <MoleculeTableCell mainText={row.title} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'category',
                    label: 'Catégorie',
                    render: (_: any, row: FormationRow) => (
                        <MoleculeTableCell
                            mainText={row.category?.name ?? '—'}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'duration',
                    label: 'Durée (h)',
                    sortable: true,
                    render: (val: number) => (
                        <MoleculeTableCell mainText={String(val)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: 'Prix',
                    sortable: true,
                    render: (val: number) => (
                        <MoleculeTableCell
                            mainText={typeof val === 'number' ? `${val} €` : String(val)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: 'Statut',
                    sortable: true,
                    render: (val: string) => (
                        <AtomBadge
                            text={val === 'ACTIVE' ? 'Actif' : 'Inactif'}
                            color={val === 'ACTIVE' ? EBadgeColor.success : EBadgeColor.gray}
                            size="small"
                        />
                    ),
                },
            },
        ],
        []
    );

    const router = useRouter();

    const actions: ITableAction<FormationRow>[] = [
        {
            label: 'Modifier',
            iconName: IconComponentsEnum.edit,
            onClick: (row) => router.push(Routes.Formations.edit(row.id)),
        },
        {
            label: 'Archiver',
            iconName: IconComponentsEnum.archive,
            onClick: (row) => {
                setFormationArchiveAction({ formation: row, type: 'archive' });
                openModal();
            },
            isVisible: (row) => row.status === 'ACTIVE',
        },
        {
            label: 'Désarchiver',
            iconName: IconComponentsEnum.archive,
            onClick: (row) => {
                setFormationArchiveAction({ formation: row, type: 'unarchive' });
                openModal();
            },
            isVisible: (row) => row.status === 'INACTIVE',
        },
        {
            label: 'Supprimer',
            iconName: IconComponentsEnum.close,
            onClick: (row) => {
                setFormationToDelete(row);
                openModal();
            },
        },
    ];

    const handleConfirmDelete = () => {
        if (formationToDelete) {
            deleteMutation.mutate(formationToDelete.id);
        }
    };

    const handleConfirmArchive = () => {
        if (formationArchiveAction) {
            if (formationArchiveAction.type === 'archive') {
                archiveMutation.mutate(formationArchiveAction.formation.id);
            } else {
                unarchiveMutation.mutate(formationArchiveAction.formation.id);
            }
        }
    };

    const archiveModalContent = formationArchiveAction && (
        <ConfirmationModal
            title={formationArchiveAction.type === 'archive' ? 'Archiver la formation' : 'Désarchiver la formation'}
            description={
                formationArchiveAction.type === 'archive'
                    ? `Êtes-vous sûr de vouloir archiver la formation "${formationArchiveAction.formation.title}" ?`
                    : `Êtes-vous sûr de vouloir désarchiver la formation "${formationArchiveAction.formation.title}" ?`
            }
            submitBtnText={formationArchiveAction.type === 'archive' ? 'Archiver' : 'Désarchiver'}
            cancelBtnText="Annuler"
            onSubmit={handleConfirmArchive}
            isLoading={archiveMutation.isPending || unarchiveMutation.isPending}
            icon={IconComponentsEnum.info}
            iconBgColor="bg-primary-100"
            iconColor="text-primary-500"
        />
    );

    return (
        <>
            {formationToDelete &&
                modalPortal(
                    <ConfirmationModal
                        title="Supprimer la formation"
                        description={`Êtes-vous sûr de vouloir supprimer la formation "${formationToDelete.title}" ? Cette action est irréversible.`}
                        submitBtnText="Supprimer"
                        cancelBtnText="Annuler"
                        onSubmit={handleConfirmDelete}
                        isLoading={deleteMutation.isPending}
                        icon={IconComponentsEnum.info}
                        iconBgColor="bg-danger-100"
                        iconColor="text-danger-600"
                    />
                )}

            {formationArchiveAction && modalPortal(archiveModalContent)}

            <FormationFiltersModal
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                }}
                categories={categories}
            />

            <LayoutWrapper
            title="Formations"
            subTitle="Gérez les formations proposées par le centre."
            mainSection={
                <div className="min-h-full">
                    <OrganismTable<FormationRow>
                        title="Liste des formations"
                        badge={`${totalRows} formation${totalRows === 1 ? '' : 's'}`}
                        columns={columns}
                        rows={rows}
                        pageSize={10}
                        searchable
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        filterTags={[...filterTags, ...activeFilterTags]}
                        placeholder="Recherche"
                        onAddTag={(tag) => {
                            const clean = tag.trim();
                            if (!clean) return;
                            if (filterTags.some((t) => t.toLowerCase() === clean.toLowerCase())) return;
                            setFilterTags((prev) => [...prev, clean]);
                        }}
                        onRemoveTag={(tag) => {
                            const filterTag = activeFilterTags.find((t) => t === tag);
                            if (filterTag) {
                                if (tag.startsWith('Statut:')) setFilters((f) => ({ ...f, status: undefined }));
                                else if (tag.startsWith('Catégorie:')) setFilters((f) => ({ ...f, categoryId: undefined }));
                                else if (tag.startsWith('Prix:')) setFilters((f) => ({ ...f, priceMin: undefined, priceMax: undefined }));
                                else if (tag.startsWith('Durée:')) setFilters((f) => ({ ...f, durationMin: undefined, durationMax: undefined }));
                                setPage(1);
                            } else {
                                setFilterTags((prev) => prev.filter((t) => t !== tag));
                            }
                        }}
                        onReset={() => {
                            setFilterTags([]);
                            setFilters({});
                            setPage(1);
                        }}
                        clearSearchOnAddTag
                        onClickFilter={() => setFiltersOpen(true)}
                        primaryAction={
                            <Button
                                id="formation-add-btn"
                                icon={{ name: IconComponentsEnum.plus, color: 'text-white', size: ESize.md }}
                                text="Ajouter"
                                iconPosition="left"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                onClick={() => router.push(Routes.Formations.new)}
                            />
                        }
                        actions={actions}
                        isLoading={isLoading}
                        emptyMessage="Aucune formation disponible"
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

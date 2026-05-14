'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { Button, Input } from '@/components/Molecules';
import {
    EButtonSize,
    EButtonType,
    IconComponentsEnum,
    EToastType,
    EVariantLabel,
    ESize,
} from '@/Enum/Enum';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import {
    fetchFormationCategories,
    createFormationCategory,
    updateFormationCategory,
    deleteFormationCategory,
    type FormationCategory,
} from '@/lib/formation-api';
import CategoryFormModal from '@/components/Modals/CategoryFormModal/CategoryFormModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { Div, Icon, Label, Spinner } from '@/components/Atoms';

function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR');
}

type ModalState =
    | { type: 'form'; category: FormationCategory | null }
    | { type: 'delete'; category: FormationCategory }
    | null;

export default function FormationCategoriesPage() {
    const [searchValue, setSearchValue] = useState('');
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['formation-categories'],
        queryFn: fetchFormationCategories,
        enabled: true,
    });

    const filteredCategories = categories.filter(
        (c) =>
            c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            (c.specifications ?? []).some((s) =>
                s.toLowerCase().includes(searchValue.toLowerCase())
            )
    );

    const createMutation = useMutation({
        mutationFn: (values: { name: string; specifications?: string[] }) =>
            createFormationCategory(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formation-categories'] });
            openToast('Succès', 'Catégorie créée avec succès.', { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, values }: { id: string; values: { name: string; specifications?: string[] } }) =>
            updateFormationCategory(id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formation-categories'] });
            openToast('Succès', 'Catégorie modifiée avec succès.', { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteFormationCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formation-categories'] });
            openToast('Succès', 'Catégorie supprimée.', { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const handleOpenCreate = () => {
        setModalState({ type: 'form', category: null });
        openModal();
    };

    const handleOpenEdit = (category: FormationCategory) => {
        setModalState({ type: 'form', category });
        openModal();
    };

    const handleOpenDelete = (category: FormationCategory) => {
        setModalState({ type: 'delete', category });
        openModal();
    };

    const handleFormSubmit = async (values: { name: string; specifications: string[] }) => {
        const specs = (values.specifications ?? []).filter((s) => s.trim());
        if (modalState?.type === 'form' && modalState.category) {
            await updateMutation.mutateAsync({
                id: modalState.category.id,
                values: { name: values.name, specifications: specs },
            });
        } else {
            await createMutation.mutateAsync({
                name: values.name,
                specifications: specs,
            });
        }
    };

    const handleConfirmDelete = () => {
        if (modalState?.type === 'delete') {
            deleteMutation.mutate(modalState.category.id);
        }
    };

    const renderModalContent = () => {
        if (modalState?.type === 'form') {
            return (
                <CategoryFormModal
                    mode={modalState.category ? 'edit' : 'create'}
                    category={modalState.category}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title="Supprimer la catégorie"
                    description={`Êtes-vous sûr de vouloir supprimer la catégorie "${modalState.category.name}" ? Cette action est irréversible.`}
                    submitBtnText="Supprimer"
                    cancelBtnText="Annuler"
                    onSubmit={handleConfirmDelete}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        return <Div />;
    };

    const renderCategoryList = () => {
        if (isLoading) {
            return (
                <Div className="flex items-center justify-center py-16">
                    <Spinner color="text-gray-900" size="text-xxl" />
                </Div>
            );
        }
        if (filteredCategories.length === 0) {
            return (
                <Div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                        {searchValue
                            ? 'Aucune catégorie trouvée'
                            : 'Aucune catégorie. Cliquez sur "Ajouter" pour en créer une.'}
                    </Label>
                </Div>
            );
        }
        return (
            <Div className="space-y-3">
                {filteredCategories.map((category) => (
                    <Div
                        key={category.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-colors"
                    >
                        <Div className="flex items-center justify-between p-4">
                            <Div className="flex items-center gap-4 flex-1 min-w-0">
                                <Div className="shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <Icon
                                        name={IconComponentsEnum.squaresFour}
                                        color="text-primary-600"
                                        size="text-large"
                                    />
                                </Div>
                                <Div className="min-w-0 flex-1">
                                    <Label
                                        variant={EVariantLabel.bodyLarge}
                                        color="text-gray-900"
                                        className="font-medium block truncate"
                                    >
                                        {category.name}
                                    </Label>
                                    {(category.specifications?.length ?? 0) > 0 && (
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-500"
                                            className="mt-0.5 line-clamp-2"
                                        >
                                            {(category.specifications ?? []).join(' • ')}
                                        </Label>
                                    )}
                                    <Label
                                        variant={EVariantLabel.hint}
                                        color="text-gray-400"
                                        className="mt-1 flex items-center gap-1"
                                    >
                                        <Icon name={IconComponentsEnum.info} color="text-gray-400" size="text-small" />
                                        {formatRelativeTime(category.createdAt)}
                                    </Label>
                                </Div>
                            </Div>
                            <Div className="flex items-center gap-2 shrink-0 ml-4">
                                <Button
                                    id={`category-edit-${category.id}`}
                                    type={EButtonType.iconButton}
                                    icon={{ name: IconComponentsEnum.edit, color: 'text-gray-600', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenEdit(category)}
                                    className="hover:bg-gray-100 hover:text-primary-600"
                                />
                                <Button
                                    id={`category-delete-${category.id}`}
                                    type={EButtonType.iconButton}
                                    icon={{ name: IconComponentsEnum.archive, color: 'text-gray-600', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenDelete(category)}
                                    className="hover:bg-danger-50 hover:text-danger-600"
                                />
                            </Div>
                        </Div>
                    </Div>
                ))}
            </Div>
        );
    };

    return (
        <>
            {modalPortal(renderModalContent())}

            <LayoutWrapper
                title="Catégories de formations"
                subTitle="Gérez les catégories de formations."
                rightActions={
                    <Button
                        id="category-add-btn"
                        icon={{ name: IconComponentsEnum.plus, color: 'text-white', size: ESize.md }}
                        text="Ajouter"
                        iconPosition="left"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        onClick={handleOpenCreate}
                    />
                }
                mainSection={
                    <Div className="min-h-full">
                        <Div className="flex items-center justify-between mb-6">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                {filteredCategories.length} catégorie
                                {filteredCategories.length === 1 ? '' : 's'}
                            </Label>
                            <Div className="flex items-center gap-3 flex-1 max-w-sm">
                                <Input
                                    id="category-search"
                                    placeholder="Rechercher..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    leftIcon={IconComponentsEnum.search}
                                    containerClassName="flex-1"
                                    className="border-gray-200"
                                />
                            </Div>
                        </Div>

                        {renderCategoryList()}
                    </Div>
                }
            />
        </>
    );
};

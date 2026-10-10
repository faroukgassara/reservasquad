'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import PosThumbnail from '@/components/Organisms/Pos/PosThumbnail';
import Button from '@/components/Primitives/Button/Button';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import PosCategoryFormModal, {
    type PosCategoryFormValues,
} from '@/components/Modals/PosCategoryFormModal/PosCategoryFormModal';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
    createPosCategory,
    deletePosCategory,
    fetchPosCategories,
    updatePosCategory,
    type PosCategory,
} from '@/lib/pos-api';
import { EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; category: PosCategory | null }
    | { type: 'delete'; category: PosCategory }
    | null;

export default function PosCategoriesPage() {
    const t = useTranslations('pos.categories');
    const tCommon = useTranslations('common');
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const [searchValue, setSearchValue] = useState('');
    const [modalState, setModalState] = useState<ModalState>(null);
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['pos-categories'],
        queryFn: fetchPosCategories,
    });

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ['pos-categories'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-products-available'] });
    };

    const onError = (error: Error) =>
        openToast(tCommon('error'), error.message, { type: EToastType.ERROR });

    const saveMutation = useMutation({
        mutationFn: ({ id, body }: { id?: string; body: Parameters<typeof createPosCategory>[0] }) =>
            id ? updatePosCategory(id, body) : createPosCategory(body),
        onSuccess: () => {
            invalidate();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            closeModal();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePosCategory,
        onSuccess: () => {
            invalidate();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
        },
        onError,
    });

    const handleSubmit = useCallback(
        async (values: PosCategoryFormValues) => {
            const category = modalState?.type === 'form' ? modalState.category : null;
            await saveMutation.mutateAsync({
                id: category?.id,
                body: {
                    name: values.name.trim(),
                    sortOrder: Math.max(0, Math.trunc(Number(values.sortOrder) || 0)),
                    imageUrl: values.imageUrl || null,
                },
            });
        },
        [modalState, saveMutation],
    );

    const rows = useMemo(() => {
        const search = searchValue.trim().toLowerCase();
        return search ? categories.filter((c) => c.name.toLowerCase().includes(search)) : categories;
    }, [categories, searchValue]);

    const columns = useMemo(
        (): ITableColumn<PosCategory>[] => [
            {
                headerElement: {
                    value: 'name',
                    label: t('name'),
                    mobile: 'primary',
                    render: (_: unknown, row: PosCategory) => (
                        <OrganismTable.Cell
                            leftChildren={<PosThumbnail imageUrl={row.imageUrl} alt={row.name} />}
                            mainText={row.name}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'productCount',
                    label: t('productCount'),
                    render: (_: unknown, row: PosCategory) => (
                        <OrganismTable.Cell mainText={String(row.productCount ?? 0)} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'sortOrder',
                    label: t('sortOrder'),
                    render: (_: unknown, row: PosCategory) => (
                        <OrganismTable.Cell mainText={String(row.sortOrder)} />
                    ),
                },
            },
        ],
        [t],
    );

    const actions = useMemo((): ITableAction<PosCategory>[] => {
        const items: ITableAction<PosCategory>[] = [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', category: row });
                    openModal();
                },
            },
        ];
        if (isAdmin) {
            items.push({
                label: tCommon('delete'),
                iconName: IconComponentsEnum.trash,
                onClick: (row) => {
                    setModalState({ type: 'delete', category: row });
                    openModal();
                },
            });
        }
        return items;
    }, [isAdmin, openModal, tCommon]);

    const renderModalContent = () => {
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.category.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <PosCategoryFormModal
                    category={modalState.category}
                    onSubmit={handleSubmit}
                    isLoading={saveMutation.isPending}
                />
            );
        }
        return null;
    };

    return (
        <>
            {modalPortal(renderModalContent())}
            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <OrganismTable<PosCategory>
                        columns={columns}
                        rows={rows}
                        pageSize={20}
                        searchable
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        placeholder={tCommon('search')}
                        actions={actions}
                        isLoading={isLoading}
                        emptyMessage={t('empty')}
                        primaryAction={
                            <Button
                                id="pos-category-add-btn"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                iconPosition="left"
                                icon={{ name: IconComponentsEnum.plus, size: ESize.sm, color: 'text-white' }}
                                text={t('create')}
                                onClick={() => {
                                    setModalState({ type: 'form', category: null });
                                    openModal();
                                }}
                            />
                        }
                    />
                }
            />
        </>
    );
}

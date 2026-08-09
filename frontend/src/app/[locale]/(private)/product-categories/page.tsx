'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
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
    fetchProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    type ProductCategory,
} from '@/lib/product-api';
import ProductCategoryFormModal, {
    type ProductCategoryFormValues,
} from '@/components/Modals/ProductCategoryFormModal/ProductCategoryFormModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';

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
    | { type: 'form'; category: ProductCategory | null }
    | { type: 'delete'; category: ProductCategory }
    | null;

export default function ProductCategoriesPage() {
    const t = useTranslations('admin.productCategories');
    const tCommon = useTranslations('common');

    const [searchValue, setSearchValue] = useState('');
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['product-categories'],
        queryFn: fetchProductCategories,
        enabled: true,
    });

    const filteredCategories = categories.filter(
        (c) =>
            c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            (c.description ?? '').toLowerCase().includes(searchValue.toLowerCase()),
    );

    const createMutation = useMutation({
        mutationFn: (values: ProductCategoryFormValues) =>
            createProductCategory({
                name: values.name,
                description: values.description.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, values }: { id: string; values: ProductCategoryFormValues }) =>
            updateProductCategory(id, {
                name: values.name,
                description: values.description.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProductCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const handleOpenCreate = () => {
        setModalState({ type: 'form', category: null });
        openModal();
    };

    const handleOpenEdit = (category: ProductCategory) => {
        setModalState({ type: 'form', category });
        openModal();
    };

    const handleOpenDelete = (category: ProductCategory) => {
        setModalState({ type: 'delete', category });
        openModal();
    };

    const handleFormSubmit = async (values: ProductCategoryFormValues) => {
        if (modalState?.type === 'form' && modalState.category) {
            await updateMutation.mutateAsync({
                id: modalState.category.id,
                values,
            });
        } else {
            await createMutation.mutateAsync(values);
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
                <ProductCategoryFormModal
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
                    title={tCommon('delete')}
                    description={t('confirmDelete')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
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
                    <Spinner color="text-primary-500" size={ESize.xl} />
                </Div>
            );
        }
        if (filteredCategories.length === 0) {
            return (
                <Div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                        {searchValue ? tCommon('noResults') : t('empty')}
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
                        <Div className="flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                            <Div className="flex items-center gap-4 flex-1 min-w-0">
                                <Div className="shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <Icon
                                        name={IconComponentsEnum.squaresFour}
                                        color="text-primary-600"
                                        size={ESize.lg}
                                    />
                                </Div>
                                <Div className="min-w-0 flex-1 flex flex-col gap-1">
                                    <Label
                                        variant={EVariantLabel.h6}
                                        color="text-gray-900"
                                        className="block truncate"
                                    >
                                        {category.name}
                                    </Label>
                                    {category.description ? (
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-gray-500"
                                            className="mt-0.5 line-clamp-2"
                                        >
                                            {category.description}
                                        </Label>
                                    ) : null}
                                    <Label
                                        variant={EVariantLabel.hint}
                                        color="text-gray-400"
                                        className="mt-1 flex items-center gap-1"
                                    >
                                        {formatRelativeTime(category.createdAt)}
                                    </Label>
                                </Div>
                            </Div>
                            <Div className="ml-0 flex shrink-0 items-center gap-2 self-end sm:ml-4 sm:self-auto">
                                <Button
                                    id={`product-category-edit-${category.id}`}
                                    type={EButtonType.secondary}
                                    icon={{
                                        name: IconComponentsEnum.edit,
                                        color: 'text-primary-500',
                                        size: ESize.md,
                                    }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenEdit(category)}
                                />
                                <Button
                                    id={`product-category-delete-${category.id}`}
                                    type={EButtonType.secondary}
                                    icon={{
                                        name: IconComponentsEnum.trash,
                                        color: 'text-primary-500',
                                        size: ESize.md,
                                    }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenDelete(category)}
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
                title={t('title')}
                subTitle={t('subtitle')}
                rightActions={
                    <Button
                        id="product-category-add-btn"
                        icon={{ name: IconComponentsEnum.plus, color: 'text-white', size: ESize.md }}
                        text={t('add')}
                        iconPosition="left"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        onClick={handleOpenCreate}
                    />
                }
                mainSection={
                    <Div className="min-h-full">
                        <Div className="flex items-center gap-3 flex-1 max-w-sm mb-6">
                            <Input
                                id="product-category-search"
                                placeholder={tCommon('search')}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                leftIcon={IconComponentsEnum.search}
                                containerClassName="flex-1"
                                className="border-gray-200"
                            />
                        </Div>

                        {renderCategoryList()}
                    </Div>
                }
            />
        </>
    );
}

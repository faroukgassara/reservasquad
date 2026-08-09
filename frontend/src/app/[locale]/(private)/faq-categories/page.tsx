'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum, EToastType, EVariantLabel } from '@/Enum/Enum';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import FaqCategoryFormModal, {
    type FaqCategoryFormValues,
} from '@/components/Modals/FaqCategoryFormModal/FaqCategoryFormModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import {
    fetchFaqCategories,
    createFaqCategory,
    updateFaqCategory,
    deleteFaqCategory,
    type FaqCategoryRecord,
} from '@/lib/faq-api';

type ModalState =
    | { type: 'form'; category: FaqCategoryRecord | null }
    | { type: 'delete'; category: FaqCategoryRecord }
    | null;

export default function FaqCategoriesAdminPage() {
    const t = useTranslations('admin.faqCategories');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const [searchValue, setSearchValue] = useState('');
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['faq-categories'],
        queryFn: fetchFaqCategories,
    });

    const filtered = categories.filter(
        (c) =>
            c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            (c.description ?? '').toLowerCase().includes(searchValue.toLowerCase()),
    );

    const createMutation = useMutation({
        mutationFn: createFaqCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateFaqCategory>[1] }) =>
            updateFaqCategory(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFaqCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
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

    const handleOpenEdit = (category: FaqCategoryRecord) => {
        setModalState({ type: 'form', category });
        openModal();
    };

    const handleOpenDelete = (category: FaqCategoryRecord) => {
        setModalState({ type: 'delete', category });
        openModal();
    };

    const handleFormSubmit = async (values: FaqCategoryFormValues) => {
        const payload = {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            sortOrder: values.sortOrder,
            status: values.status,
        };

        if (modalState?.type === 'form' && modalState.category) {
            await updateMutation.mutateAsync({ id: modalState.category.id, body: payload });
        } else {
            await createMutation.mutateAsync(payload);
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
                <FaqCategoryFormModal
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

    const renderList = () => {
        if (isLoading) {
            return (
                <Div className="flex items-center justify-center py-16">
                    <Spinner color="text-primary-500" size={ESize.xl} />
                </Div>
            );
        }
        if (filtered.length === 0) {
            return (
                <Div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                        {searchValue ? tCommon('noResults') : t('empty')}
                    </Label>
                </Div>
            );
        }
        return (
            <Div className="space-y-3">
                {filtered.map((category) => (
                    <Div
                        key={category.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-gray-300"
                    >
                        <Div className="flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                            <Div className="min-w-0 flex-1 flex flex-col gap-1">
                                <Label
                                    variant={EVariantLabel.h6}
                                    color="text-gray-900"
                                    className="block"
                                >
                                    {category.name}
                                </Label>
                                {category.description && (
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-500"
                                        className="mt-1 line-clamp-2"
                                    >
                                        {category.description}
                                    </Label>
                                )}
                                <Label variant={EVariantLabel.hint} color="text-gray-400" className="mt-1">
                                    {category.status === 'ACTIVE' ? tStatus('active') : tStatus('inactive')} ·{' '}
                                    {category.sortOrder}
                                </Label>
                            </Div>
                            <Div className="ml-0 flex shrink-0 items-center gap-2 self-end sm:ml-4 sm:self-auto">
                                <Button
                                    id={`faq-category-edit-${category.id}`}
                                    type={EButtonType.secondary}
                                    icon={{ name: IconComponentsEnum.edit, color: 'text-primary-500', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenEdit(category)}
                                />
                                <Button
                                    id={`faq-category-delete-${category.id}`}
                                    type={EButtonType.secondary}
                                    icon={{ name: IconComponentsEnum.trash, color: 'text-primary-500', size: ESize.md }}
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
                        id="faq-category-add-btn"
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
                        <Div className="flex max-w-sm flex-1 items-center gap-3 mb-6">
                            <Input
                                id="faq-category-search"
                                placeholder={tCommon('search')}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                leftIcon={IconComponentsEnum.search}
                                containerClassName="flex-1"
                                className="border-gray-200"
                            />
                        </Div>
                        {renderList()}
                    </Div>
                }
            />
        </>
    );
}

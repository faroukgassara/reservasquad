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
import FaqFormModal, { type FaqFormValues } from '@/components/Modals/FaqFormModal/FaqFormModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import {
    fetchFaqs,
    fetchFaqCategories,
    createFaq,
    updateFaq,
    deleteFaq,
    type FaqRecord,
} from '@/lib/faq-api';

type ModalState = { type: 'form'; faq: FaqRecord | null } | { type: 'delete'; faq: FaqRecord } | null;

export default function FaqsAdminPage() {
    const t = useTranslations('admin.faqs');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const [searchValue, setSearchValue] = useState('');
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const { data: faqs = [], isLoading } = useQuery({
        queryKey: ['faqs'],
        queryFn: fetchFaqs,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['faq-categories'],
        queryFn: fetchFaqCategories,
    });

    const filtered = faqs.filter(
        (f) =>
            f.question.toLowerCase().includes(searchValue.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const createMutation = useMutation({
        mutationFn: createFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            openToast(tCommon('success'), tCommon('create'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateFaq>[1] }) => updateFaq(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faqs'] });
            queryClient.invalidateQueries({ queryKey: ['public-faq-categories'] });
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const handleOpenCreate = () => {
        setModalState({ type: 'form', faq: null });
        openModal();
    };

    const handleOpenEdit = (faq: FaqRecord) => {
        setModalState({ type: 'form', faq });
        openModal();
    };

    const handleOpenDelete = (faq: FaqRecord) => {
        setModalState({ type: 'delete', faq });
        openModal();
    };

    const handleFormSubmit = async (values: FaqFormValues) => {
        const payload = {
            question: values.question.trim(),
            answer: values.answer.trim(),
            categoryId: values.categoryId,
            sortOrder: values.sortOrder,
            status: values.status,
        };

        if (modalState?.type === 'form' && modalState.faq) {
            await updateMutation.mutateAsync({ id: modalState.faq.id, body: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
    };

    const handleConfirmDelete = () => {
        if (modalState?.type === 'delete') {
            deleteMutation.mutate(modalState.faq.id);
        }
    };

    const renderModalContent = () => {
        if (modalState?.type === 'form') {
            return (
                <FaqFormModal
                    mode={modalState.faq ? 'edit' : 'create'}
                    faq={modalState.faq}
                    categories={categories}
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
                {filtered.map((faq) => (
                    <Div
                        key={faq.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-gray-300"
                    >
                        <Div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                            <Div className="flex min-w-0 flex-1 items-start gap-4">
                                <Div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                                    <Icon name={IconComponentsEnum.info} color="text-primary-600" size={ESize.lg} />
                                </Div>
                                <Div className="min-w-0 flex-1 flex flex-col gap-1">
                                    <Label
                                        variant={EVariantLabel.h6}
                                        color="text-gray-900"
                                        className="block"
                                    >
                                        {faq.question}
                                    </Label>
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-1 line-clamp-2">
                                        {faq.answer}
                                    </Label>
                                    <Label variant={EVariantLabel.hint} color="text-gray-400" className="mt-1">
                                        {faq.category?.name ?? 'Sans catégorie'} ·{' '}
                                        {faq.status === 'ACTIVE' ? tStatus('active') : tStatus('inactive')} ·{' '}
                                        {faq.sortOrder}
                                    </Label>
                                </Div>
                            </Div>
                            <Div className="ml-0 flex shrink-0 items-center gap-2 self-end sm:ml-4 sm:self-auto">
                                <Button
                                    id={`faq-edit-${faq.id}`}
                                    type={EButtonType.secondary}
                                    icon={{ name: IconComponentsEnum.edit, color: 'text-primary-500', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenEdit(faq)}
                                />
                                <Button
                                    id={`faq-delete-${faq.id}`}
                                    type={EButtonType.secondary}
                                    icon={{ name: IconComponentsEnum.trash, color: 'text-primary-500', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenDelete(faq)}
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
                        id="faq-add-btn"
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
                        <Div className="mb-6 w-full max-w-none sm:max-w-sm">
                            <Input
                                id="faq-search"
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

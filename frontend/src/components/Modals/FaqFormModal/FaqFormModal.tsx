'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import {
    DrawerActions,
    DrawerForm,
    DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';
import type { FaqRecord, FaqCategoryRecord } from '@/lib/faq-api';

export interface FaqFormValues {
    question: string;
    answer: string;
    categoryId: string;
    sortOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
}

type FaqStatus = FaqFormValues['status'];

function isFaqStatus(value: string | number | (string | number)[]): value is FaqStatus {
    return value === 'ACTIVE' || value === 'INACTIVE';
}

function isCategoryValue(value: string | number | (string | number)[]): value is string {
    return typeof value === 'string';
}

interface FaqFormModalProps {
    mode: 'create' | 'edit';
    faq?: FaqRecord | null;
    categories: FaqCategoryRecord[];
    onSubmit: (values: FaqFormValues) => Promise<void>;
    isLoading?: boolean;
}

function getSubmitButtonText(
    isSubmitting: boolean,
    isLoading: boolean,
    isEdit: boolean,
    tCommon: ReturnType<typeof useTranslations>,
): string {
    if (isSubmitting || isLoading) {
        return tCommon('loading');
    }
    if (isEdit) {
        return tCommon('save');
    }
    return tCommon('create');
}

const FaqFormModal: React.FC<FaqFormModalProps> = ({
    mode,
    faq,
    categories,
    onSubmit,
    isLoading = false,
}) => {
    const t = useTranslations('admin.faqs');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const categoryOptions = useMemo(
        () => [
            { value: '', label: t('placeholders.category') },
            ...categories.map((category) => ({
                value: category.id,
                label: category.name,
            })),
        ],
        [categories, t],
    );

    const statusOptions = useMemo(
        () => [
            { value: 'ACTIVE' as const, label: tStatus('active') },
            { value: 'INACTIVE' as const, label: tStatus('inactive') },
        ],
        [tStatus],
    );

    const form = useForm({
        defaultValues: {
            question: faq?.question ?? '',
            answer: faq?.answer ?? '',
            categoryId: faq?.categoryId ?? categories[0]?.id ?? '',
            sortOrder: faq?.sortOrder ?? 0,
            status: (faq?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as FaqStatus,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as FaqFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (faq) {
            form.setFieldValue('question', faq.question);
            form.setFieldValue('answer', faq.answer);
            form.setFieldValue('categoryId', faq.categoryId);
            form.setFieldValue('sortOrder', faq.sortOrder);
            form.setFieldValue('status', faq.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        }
    }, [faq, form]);

    return (
        <Modal
            title={isEdit ? t('modalEditTitle') : t('modalCreateTitle')}
            subTitle={t('subtitle')}
            canClose={true}
            canCloseOnClickOutisde={true}
            isDrawer={true}
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <DrawerScrollContent className="gap-0 space-y-4 p-6">
                    <form.Field
                        name="question"
                        validators={{
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : 'La question est requise',
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="Question"
                                placeholder={t('placeholders.question')}
                                value={state.value}
                                id="faq-question"
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="answer"
                        validators={{
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : 'La réponse est requise',
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label="Réponse"
                                placeholder={t('placeholders.answer')}
                                value={state.value}
                                id="faq-answer"
                                onChange={(e) => handleChange(e.target.value)}
                                isTextArea
                                rows={5}
                                required
                                hintText={state.meta.errors?.[0]}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="categoryId"
                        validators={{
                            onSubmit: ({ value }) =>
                                value?.trim() ? undefined : t('validation.categoryRequired'),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('fields.category')}
                                options={categoryOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (isCategoryValue(value)) handleChange(value);
                                }}
                                placeholder={t('placeholders.category')}
                                required
                                error={!!state.meta.errors?.length}
                                hintText={state.meta.errors?.[0]}
                            />
                        )}
                    </form.Field>

                    <form.Field name="sortOrder">
                        {({ state, handleChange }) => (
                            <Input
                                label="Ordre d'affichage"
                                type={EInputType.number}
                                placeholder="0"
                                value={String(state.value)}
                                id="faq-sort-order"
                                onChange={(e) =>
                                    handleChange(Number.parseInt(e.target.value, 10) || 0)
                                }
                            />
                        )}
                    </form.Field>

                    <form.Field name="status">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={tCommon('status')}
                                options={statusOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (isFaqStatus(value)) handleChange(value);
                                }}
                                placeholder={tCommon('status')}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="faq-form-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                id="faq-form-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={getSubmitButtonText(isSubmitting, isLoading, isEdit, tCommon)}
                                disabled={!canSubmit || isSubmitting || isLoading}
                                onClick={() => form.handleSubmit()}
                                className="flex-1"
                            />
                        )}
                    </form.Subscribe>
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
};

export default FaqFormModal;

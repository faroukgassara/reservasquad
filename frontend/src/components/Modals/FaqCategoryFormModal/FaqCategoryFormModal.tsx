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
import type { FaqCategoryRecord } from '@/lib/faq-api';

export interface FaqCategoryFormValues {
    name: string;
    description: string;
    sortOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
}

type FaqCategoryStatus = FaqCategoryFormValues['status'];

function isFaqCategoryStatus(
    value: string | number | (string | number)[],
): value is FaqCategoryStatus {
    return value === 'ACTIVE' || value === 'INACTIVE';
}

interface FaqCategoryFormModalProps {
    mode: 'create' | 'edit';
    category?: FaqCategoryRecord | null;
    onSubmit: (values: FaqCategoryFormValues) => Promise<void>;
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

const FaqCategoryFormModal: React.FC<FaqCategoryFormModalProps> = ({
    mode,
    category,
    onSubmit,
    isLoading = false,
}) => {
    const t = useTranslations('admin.faqCategories');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const statusOptions = useMemo(
        () => [
            { value: 'ACTIVE' as const, label: tStatus('active') },
            { value: 'INACTIVE' as const, label: tStatus('inactive') },
        ],
        [tStatus],
    );

    const form = useForm({
        defaultValues: {
            name: category?.name ?? '',
            description: category?.description ?? '',
            sortOrder: category?.sortOrder ?? 0,
            status: (category?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as FaqCategoryStatus,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as FaqCategoryFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (category) {
            form.setFieldValue('name', category.name);
            form.setFieldValue('description', category.description ?? '');
            form.setFieldValue('sortOrder', category.sortOrder);
            form.setFieldValue('status', category.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        }
    }, [category, form]);

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
                    name="name"
                    validators={{
                        onSubmit: ({ value }) => (value?.trim() ? undefined : 'Le nom est requis'),
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            label="Nom"
                            placeholder={t('placeholders.name')}
                            value={state.value}
                            id="faq-category-name"
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0]}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>

                <form.Field name="description">
                    {({ state, handleChange }) => (
                        <Input
                            label="Description"
                            placeholder={t('placeholders.description')}
                            value={state.value}
                            id="faq-category-description"
                            onChange={(e) => handleChange(e.target.value)}
                            isTextArea
                            rows={3}
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
                            id="faq-category-sort-order"
                            onChange={(e) => handleChange(Number.parseInt(e.target.value, 10) || 0)}
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
                                if (isFaqCategoryStatus(value)) handleChange(value);
                            }}
                            placeholder={tCommon('status')}
                        />
                    )}
                </form.Field>
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="faq-category-form-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                id="faq-category-form-submit"
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

export default FaqCategoryFormModal;

'use client';

import React, { useEffect } from 'react';
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
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType } from '@/Enum/Enum';
import type { ProductCategory } from '@/lib/product-api';

export interface ProductCategoryFormValues {
    name: string;
    description: string;
}

interface ProductCategoryFormModalProps {
    mode: 'create' | 'edit';
    category?: ProductCategory | null;
    onSubmit: (values: ProductCategoryFormValues) => Promise<void>;
    isLoading?: boolean;
}

const ProductCategoryFormModal: React.FC<ProductCategoryFormModalProps> = ({
    mode,
    category,
    onSubmit,
    isLoading = false,
}) => {
    const t = useTranslations('admin.productCategories');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            name: category?.name ?? '',
            description: category?.description ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as ProductCategoryFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (category) {
            form.setFieldValue('name', category.name);
            form.setFieldValue('description', category.description ?? '');
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
                            onSubmit: ({ value }) =>
                                !value?.trim() ? t('validation.nameRequired') : undefined,
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('name')}
                                placeholder={t('placeholders.name')}
                                value={state.value}
                                id="product-category-name"
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
                                label={t('description')}
                                placeholder={t('placeholders.description')}
                                value={state.value}
                                id="product-category-description"
                                onChange={(e) => handleChange(e.target.value)}
                                isTextArea
                                rows={3}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="product-category-form-cancel-btn"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => {
                            let submitLabel = tCommon('create');
                            if (isSubmitting || isLoading) {
                                submitLabel = tCommon('loading');
                            } else if (isEdit) {
                                submitLabel = tCommon('save');
                            }

                            return (
                                <Button
                                    id="product-category-form-submit-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    text={submitLabel}
                                    disabled={!canSubmit || isSubmitting || isLoading}
                                    onClick={() => form.handleSubmit()}
                                    className="flex-1"
                                />
                            );
                        }}
                    </form.Subscribe>
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
};

export default ProductCategoryFormModal;

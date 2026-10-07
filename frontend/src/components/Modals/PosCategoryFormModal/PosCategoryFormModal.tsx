'use client';

import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import {
    DrawerActions,
    DrawerForm,
    DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Input from '@/components/Primitives/Input/Input';
import ImageUpload from '@/components/Primitives/ImageUpload/ImageUpload';
import Button from '@/components/Primitives/Button/Button';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType } from '@/Enum/Enum';
import type { PosCategory } from '@/lib/pos-api';

export interface PosCategoryFormValues {
    name: string;
    sortOrder: string;
    imageUrl: string;
}

interface PosCategoryFormModalProps {
    category: PosCategory | null;
    onSubmit: (values: PosCategoryFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function PosCategoryFormModal({
    category,
    onSubmit,
    isLoading = false,
}: Readonly<PosCategoryFormModalProps>) {
    const t = useTranslations('pos.categories');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useForm({
        defaultValues: {
            name: category?.name ?? '',
            sortOrder: String(category?.sortOrder ?? 0),
            imageUrl: category?.imageUrl ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });

    return (
        <Modal
            title={category ? t('edit') : t('create')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <DrawerScrollContent>
                    <form.Field
                        name="name"
                        validators={{
                            onSubmit: ({ value }) => (value.trim() ? undefined : t('nameRequired')),
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                id="pos-category-name"
                                label={t('name')}
                                value={state.value}
                                onChange={(e) => handleChange(e.target.value)}
                                required
                                hintText={state.meta.errors?.[0] ? String(state.meta.errors[0]) : undefined}
                                error={!!state.meta.errors?.length}
                            />
                        )}
                    </form.Field>
                    <form.Field name="sortOrder">
                        {({ state, handleChange }) => (
                            <Input
                                id="pos-category-sort-order"
                                label={t('sortOrder')}
                                value={state.value}
                                type={EInputType.intNumber}
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        )}
                    </form.Field>
                    <form.Field name="imageUrl">
                        {({ state, handleChange }) => (
                            <ImageUpload
                                id="pos-category-image"
                                label={t('image')}
                                value={state.value}
                                onChange={handleChange}
                                onClear={() => handleChange('')}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="pos-category-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="pos-category-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}

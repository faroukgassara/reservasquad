'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import ImageUpload from '@/components/Primitives/ImageUpload/ImageUpload';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Checkbox from '@/components/Primitives/Checkbox/Checkbox';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getProductImageUrl, type ProductCategory, type ProductRecord } from '@/lib/product-api';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';

export interface ProductFormValues {
    title: string;
    description: string;
    price: string;
    discountedPrice: string;
    images: string[];
    categoryId: string;
    badges: string[];
    materials: string[];
    sizes: string[];
    hasEngraving: boolean;
    featured: boolean;
    status: 'ACTIVE' | 'INACTIVE';
}

type ProductStatus = ProductFormValues['status'];

function isProductStatus(value: string | number | (string | number)[]): value is ProductStatus {
    return value === 'ACTIVE' || value === 'INACTIVE';
}

function isCategoryValue(value: string | number | (string | number)[]): value is string {
    return typeof value === 'string';
}

function getProductImages(product?: ProductRecord | null): string[] {
    if (product?.images?.length) return [...product.images];
    if (product?.imageUrl) return [product.imageUrl];
    return [];
}

interface ProductFormModalProps {
    mode: 'create' | 'edit';
    product?: ProductRecord | null;
    categories: ProductCategory[];
    onSubmit: (values: ProductFormValues) => Promise<void>;
    isLoading?: boolean;
}

function TagListEditor({
    label,
    placeholder,
    values,
    onChange,
    addLabel,
}: Readonly<{
    label: string;
    placeholder: string;
    values: string[];
    onChange: (next: string[]) => void;
    addLabel: string;
}>) {
    const [draft, setDraft] = useState('');
    const inputId = React.useId();

    const addValue = () => {
        const next = draft.trim();
        if (!next) return;
        if (values.some((v) => v.toLowerCase() === next.toLowerCase())) {
            setDraft('');
            return;
        }
        onChange([...values, next]);
        setDraft('');
    };

    return (
        <Div className="flex flex-col gap-2">
            <Div className="flex items-end gap-2">
                <Input
                    id={inputId}
                    label={label}
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addValue();
                        }
                    }}
                    containerClassName="min-w-0 flex-1"
                />
                <Button
                    id={`${inputId}-add`}
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text={addLabel}
                    onClick={addValue}
                    className="shrink-0"
                />
            </Div>
            {values.length > 0 && (
                <Div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                        <span
                            key={value}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                        >
                            {value}
                            <Icon
                                name={IconComponentsEnum.close}
                                size={ESize.xs}
                                color="text-gray-500"
                                className="cursor-pointer hover:text-danger-500"
                                handleClick={() => onChange(values.filter((v) => v !== value))}
                            />
                        </span>
                    ))}
                </Div>
            )}
        </Div>
    );
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
    mode,
    product,
    categories,
    onSubmit,
    isLoading = false,
}) => {
    const t = useTranslations('admin.products');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const categoryOptions = useMemo(
        () => [
            { value: '', label: t('placeholders.category') },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
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
            title: product?.title ?? '',
            description: product?.description ?? '',
            price: product?.price != null ? String(product.price) : '',
            discountedPrice: product?.discountedPrice != null ? String(product.discountedPrice) : '',
            images: getProductImages(product),
            categoryId: product?.categoryId ?? '',
            badges: [...(product?.badges ?? [])],
            materials: [...(product?.materials ?? [])],
            sizes: [...(product?.sizes ?? [])],
            hasEngraving: product?.hasEngraving ?? false,
            featured: product?.featured ?? false,
            status: (product?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as ProductFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (!product) return;
        form.setFieldValue('title', product.title);
        form.setFieldValue('description', product.description ?? '');
        form.setFieldValue('price', product.price != null ? String(product.price) : '');
        form.setFieldValue('discountedPrice', product.discountedPrice != null ? String(product.discountedPrice) : '');
        form.setFieldValue('images', getProductImages(product));
        form.setFieldValue('categoryId', product.categoryId ?? '');
        form.setFieldValue('badges', [...(product.badges ?? [])]);
        form.setFieldValue('materials', [...(product.materials ?? [])]);
        form.setFieldValue('sizes', [...(product.sizes ?? [])]);
        form.setFieldValue('hasEngraving', product.hasEngraving ?? false);
        form.setFieldValue('featured', product.featured ?? false);
        form.setFieldValue('status', product.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    }, [product, form]);

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
                        name="title"
                        validators={{
                            onSubmit: ({ value }) =>
                                !value?.trim() ? t('validation.titleRequired') : undefined,
                        }}
                    >
                        {({ state, handleChange }) => (
                            <Input
                                label={t('fields.title')}
                                placeholder={t('placeholders.title')}
                                value={state.value}
                                id="product-title"
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
                                label={t('fields.description')}
                                placeholder={t('placeholders.description')}
                                value={state.value}
                                id="product-description"
                                onChange={(e) => handleChange(e.target.value)}
                                isTextArea
                                rows={5}
                            />
                        )}
                    </form.Field>

                    <Div className="grid grid-cols-1 items-end gap-3">
                        <form.Field
                            name="price"
                            validators={{
                                onSubmit: ({ value }) => {
                                    const n = Number(value);
                                    if (!value?.trim() || Number.isNaN(n) || n < 0) {
                                        return t('validation.priceInvalid');
                                    }
                                    return undefined;
                                },
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    label={t('fields.price')}
                                    placeholder={t('placeholders.price')}
                                    type={EInputType.number}
                                    value={state.value}
                                    id="product-price"
                                    onChange={(e) => handleChange(e.target.value)}
                                    required
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                />
                            )}
                        </form.Field>

                        <form.Field name="discountedPrice">
                            {({ state, handleChange }) => (
                                <Input
                                    label={t('fields.discountedPrice')}
                                    placeholder={t('placeholders.discountedPrice')}
                                    type={EInputType.number}
                                    value={state.value}
                                    id="product-discountedPrice"
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={t('hints.discountedPrice')}
                                />
                            )}
                        </form.Field>
                    </Div>

                    <form.Field name="images">
                        {({ state, handleChange }) => (
                            <Div className="flex flex-col gap-3">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                    {t('fields.images')}
                                </Label>
                                {state.value.length > 0 && (
                                    <Div className="grid grid-cols-3 gap-2">
                                        {state.value.map((src, index) => (
                                            <Div
                                                key={`${src}-${index}`}
                                                className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={getProductImageUrl(src)}
                                                    alt=""
                                                    className="aspect-square w-full object-cover"
                                                />
                                                <Icon
                                                    name={IconComponentsEnum.close}
                                                    size={ESize.sm}
                                                    color="text-white"
                                                    className="absolute end-1.5 top-1.5 cursor-pointer rounded-full bg-black/55 p-0.5"
                                                    handleClick={() =>
                                                        handleChange(
                                                            state.value.filter((_, i) => i !== index),
                                                        )
                                                    }
                                                />
                                            </Div>
                                        ))}
                                    </Div>
                                )}
                                <ImageUpload
                                    id="product-images-add"
                                    label={t('fields.addImage')}
                                    value=""
                                    onChange={(url) => {
                                        if (!url) return;
                                        handleChange([...state.value, url]);
                                    }}
                                    containerClassName="mb-0"
                                />
                            </Div>
                        )}
                    </form.Field>

                    <form.Field name="categoryId">
                        {({ state, handleChange }) => (
                            <Dropdown
                                label={t('fields.category')}
                                options={categoryOptions}
                                value={state.value}
                                onChange={(value) => {
                                    if (isCategoryValue(value)) handleChange(value);
                                }}
                                placeholder={t('placeholders.category')}
                            />
                        )}
                    </form.Field>

                    <form.Field name="badges">
                        {({ state, handleChange }) => (
                            <TagListEditor
                                label={t('fields.badges')}
                                placeholder={t('placeholders.badge')}
                                values={state.value}
                                onChange={handleChange}
                                addLabel={t('addTag')}
                            />
                        )}
                    </form.Field>

                    <form.Field name="materials">
                        {({ state, handleChange }) => (
                            <TagListEditor
                                label={t('fields.materials')}
                                placeholder={t('placeholders.material')}
                                values={state.value}
                                onChange={handleChange}
                                addLabel={t('addTag')}
                            />
                        )}
                    </form.Field>

                    <form.Field name="sizes">
                        {({ state, handleChange }) => (
                            <TagListEditor
                                label={t('fields.sizes')}
                                placeholder={t('placeholders.size')}
                                values={state.value}
                                onChange={handleChange}
                                addLabel={t('addTag')}
                            />
                        )}
                    </form.Field>

                    <form.Field name="hasEngraving">
                        {({ state, handleChange }) => (
                            <Checkbox
                                id="product-hasEngraving"
                                label={t('fields.hasEngraving')}
                                checked={state.value}
                                onChange={(e) => handleChange(e.target.checked)}
                            />
                        )}
                    </form.Field>

                    <form.Field name="featured">
                        {({ state, handleChange }) => (
                            <Checkbox
                                id="product-featured"
                                label={t('fields.featured')}
                                checked={state.value}
                                onChange={(e) => handleChange(e.target.checked)}
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
                                    if (isProductStatus(value)) handleChange(value);
                                }}
                                placeholder={tCommon('status')}
                            />
                        )}
                    </form.Field>
                </DrawerScrollContent>

                <DrawerActions>
                    <Button
                        id="product-form-cancel"
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
                                    id="product-form-submit"
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

export default ProductFormModal;

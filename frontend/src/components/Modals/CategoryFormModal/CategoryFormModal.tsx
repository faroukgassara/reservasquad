'use client';

import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { Modal, Input, Button } from '@/components/Molecules';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum, EVariantLabel } from '@/Enum/Enum';
import type { FormationCategory } from '@/lib/formation-api';
import { Div, Icon, Label } from '@/components/Atoms';

export interface CategoryFormValues {
    name: string;
    specifications: string[];
}

interface CategoryFormModalProps {
    mode: 'create' | 'edit';
    category?: FormationCategory | null;
    onSubmit: (values: CategoryFormValues) => Promise<void>;
    isLoading?: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    mode,
    category,
    onSubmit,
    isLoading = false,
}) => {
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            name: category?.name ?? '',
            specifications: category?.specifications ?? [],
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as CategoryFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (category) {
            form.setFieldValue('name', category.name);
            form.setFieldValue('specifications', category.specifications ?? []);
        }
    }, [category]);

    return (
        <Modal
            title={isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            subTitle={isEdit ? 'Modifiez les informations de la catégorie.' : 'Créez une nouvelle catégorie de formation.'}
            canClose={true}
            canCloseOnClickOutisde={true}
            isDrawer={true}
            bodyClassName="p-6"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="space-y-4"
            >
                <form.Field
                    name="name"
                    validators={{
                        onSubmit: ({ value }) =>
                            !value?.trim() ? 'Le nom est requis' : undefined,
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            label="Nom de la catégorie"
                            placeholder="Ex: Informatique"
                            value={state.value}
                            id="category-name"
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0]}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>

                <form.Field name="specifications">
                    {({ state, handleChange }) => (
                        <Div className="flex flex-col gap-2">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                Spécifications (optionnel)
                            </Label>
                            <Div className="space-y-2">
                                {(state.value ?? []).map((spec: string, index: number) => (
                                    <Div key={index} className="flex gap-2 items-center">
                                        <Input
                                            placeholder={`Spécification ${index + 1}`}
                                            value={spec}
                                            id={`category-spec-${index}`}
                                            onChange={(e) => {
                                                const newSpecs = [...(state.value ?? [])];
                                                newSpecs[index] = e.target.value;
                                                handleChange(newSpecs);
                                            }}
                                            containerClassName="flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newSpecs = (state.value ?? []).filter((_: string, i: number) => i !== index);
                                                handleChange(newSpecs);
                                            }}
                                            className="p-2 rounded-lg hover:bg-danger-50 text-gray-600 hover:text-danger-600 transition-colors shrink-0"
                                            title="Supprimer"
                                        >
                                            <Icon
                                                name={IconComponentsEnum.close}
                                                size="text-large"
                                                color="text-gray-600"
                                            />
                                        </button>
                                    </Div>
                                ))}
                            </Div>
                            <Button
                                id="category-spec-add-btn"
                                type={EButtonType.secondary}
                                size={EButtonSize.small}
                                text="Ajouter une spécification"
                                icon={{
                                    name: IconComponentsEnum.plus,
                                    size: ESize.md,
                                    color: 'text-primary-600',
                                }}
                                iconPosition="left"
                                onClick={() => handleChange([...(state.value ?? []), ''])}
                            />
                        </Div>
                    )}
                </form.Field>

                <div className="flex gap-3 pt-4">
                    <Button
                        id="category-form-cancel-btn"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text="Annuler"
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                id="category-form-submit-btn"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={isSubmitting || isLoading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
                                disabled={!canSubmit || isSubmitting || isLoading}
                                onClick={() => form.handleSubmit()}
                                className="flex-1"
                            />
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </Modal>
    );
};

export default CategoryFormModal;

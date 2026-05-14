'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { Button, Input, Dropdown, FormationCategorySelect, MoleculeImageUpload } from '@/components/Molecules';
import { Routes } from '@/lib/routes';
import { EButtonType, EButtonSize, EVariantLabel } from '@/Enum/Enum';
import { Div, Label } from '@/components/Atoms';

export interface FormationFormValues {
    title: string;
    description: string;
    duration: number;
    price: number;
    status: string;
    categoryId: string;
    imageUrl: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface ITemplateFormationForm {
    mode: 'create' | 'edit';
    initialValues?: Partial<FormationFormValues>;
    categories: CategoryOption[];
    onCategoryAdded: (category: CategoryOption) => void;
    onCreateCategory: (name: string) => Promise<CategoryOption>;
    onSubmit: (values: FormationFormValues) => Promise<void>;
    isLoading?: boolean;
}

const TemplateFormationForm: React.FC<ITemplateFormationForm> = ({
    mode,
    initialValues,
    categories,
    onCategoryAdded,
    onCreateCategory,
    onSubmit,
    isLoading = false,
}) => {
    const router = useRouter();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            title: initialValues?.title ?? '',
            description: initialValues?.description ?? '',
            duration: initialValues?.duration ?? 0,
            price: initialValues?.price ?? 0,
            status: initialValues?.status ?? 'ACTIVE',
            categoryId: initialValues?.categoryId ?? '',
            imageUrl: initialValues?.imageUrl ?? '',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as FormationFormValues);
            router.push(Routes.Formations.index);
        },
    });

    return (
        <Div className="min-h-full">
            <Div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <Div className="p-8 border-b border-gray-100">
                   <Div className='flex flex-col gap-1'>
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-900">
                        A propos de la formation
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                        Renseignez les informations générales de la formation.
                    </Label>
                   </Div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        <Div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <form.Field
                                name="title"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        !value && !isEdit
                                            ? 'Le nom de la formation est requis'
                                            : undefined,
                                }}
                            >
                                {({ state, handleChange }) => (
                                    <Input
                                        containerClassName="mb-0"
                                        label="Nom de la formation"
                                        placeholder="Nom de la formation"
                                        value={state.value}
                                        id="formation-title"
                                        onChange={(e) =>
                                            handleChange(e.target.value)
                                        }
                                        required={!isEdit}
                                        hintText={state.meta.errors?.[0]}
                                        error={!!state.meta.errors?.length}
                                    />
                                )}
                            </form.Field>

                            <form.Field
                                name="categoryId"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        !value && !isEdit
                                            ? 'La catégorie est requise'
                                            : undefined,
                                }}
                            >
                                {({ state, handleChange }) => (
                                    <FormationCategorySelect
                                        label="Catégorie"
                                        placeholder="Sélectionner une catégorie"
                                        value={state.value || undefined}
                                        onChange={(v) =>
                                            handleChange(String(v ?? ''))
                                        }
                                        options={categories}
                                        onCategoryAdded={onCategoryAdded}
                                        onCreateCategory={onCreateCategory}
                                        containerClassName="mb-0"
                                        required={!isEdit}
                                        error={state.meta.errors?.[0]}
                                    />
                                )}
                            </form.Field>

                            <form.Field
                                name="duration"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        (!value || value <= 0) && !isEdit
                                            ? 'La durée est requise et doit être supérieure à 0'
                                            : undefined,
                                }}
                            >
                                {({ state, handleChange }) => (
                                    <Input
                                        containerClassName="mb-0"
                                        label="Durée (heures)"
                                        placeholder="120"
                                        type="number"
                                        value={state.value ? String(state.value) : ''}
                                        id="formation-duration"
                                        onChange={(e) =>
                                            handleChange(
                                                Number.parseInt(e.target.value, 10) || 0
                                            )
                                        }
                                        required={!isEdit}
                                        hintText={state.meta.errors?.[0]}
                                        error={!!state.meta.errors?.length}
                                    />
                                )}
                            </form.Field>

                            <form.Field
                                name="price"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        (value === undefined || value === null || value < 0) && !isEdit
                                            ? 'Le prix est requis et doit être supérieur ou égal à 0'
                                            : undefined,
                                }}
                            >
                                {({ state, handleChange }) => (
                                    <Input
                                        containerClassName="mb-0"
                                        label="Prix (€)"
                                        placeholder="1500"
                                        type="number"
                                        value={state.value ? String(state.value) : ''}
                                        id="formation-price"
                                        onChange={(e) =>
                                            handleChange(
                                                Number.parseFloat(e.target.value) || 0
                                            )
                                        }
                                        required={!isEdit}
                                        hintText={state.meta.errors?.[0]}
                                        error={!!state.meta.errors?.length}
                                    />
                                )}
                            </form.Field>

                            <form.Field
                                name="status"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        !value && !isEdit
                                            ? 'Le statut est requis'
                                            : undefined,
                                }}
                            >
                                {({ state, handleChange }) => (
                                    <Dropdown
                                        label="Statut"
                                        placeholder="Statut"
                                        options={[
                                            { label: 'Actif', value: 'ACTIVE' },
                                            { label: 'Inactif', value: 'INACTIVE' },
                                        ]}
                                        value={state.value}
                                        onChange={(v) =>
                                            handleChange(String(v ?? 'ACTIVE'))
                                        }
                                        containerClassName="mb-0"
                                        required={!isEdit}
                                    />
                                )}
                            </form.Field>

                        </Div>

                        <form.Field
                            name="description"
                            validators={{
                                onSubmit: ({ value }) =>
                                    !value && !isEdit
                                        ? 'La description est requise'
                                        : undefined,
                            }}
                        >
                            {({ state, handleChange }) => (
                                <Input
                                    containerClassName="mb-0"
                                    label="Description de la formation"
                                    placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
                                    value={state.value}
                                    id="formation-description"
                                    isTextArea
                                    rows={4}
                                    onChange={(e) =>
                                        handleChange(e.target.value)
                                    }
                                    required={!isEdit}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                />
                            )}
                        </form.Field>

                        <form.Field
                            name="imageUrl"
                            validators={{
                                onSubmit: ({ value }) =>
                                    !value && !isEdit
                                        ? "L'image est requise"
                                        : undefined,
                            }}
                        >
                            {({ state, handleChange }) => (
                                <MoleculeImageUpload
                                    id="formation-imageUrl"
                                    label="Image de la formation"
                                    value={state.value}
                                    onChange={(url) => handleChange(url)}
                                    onClear={() => handleChange('')}
                                    required={!isEdit}
                                    hintText={state.meta.errors?.[0]}
                                    error={!!state.meta.errors?.length}
                                    containerClassName="mb-0"
                                />
                            )}
                        </form.Field>

                        <Div className="flex justify-end gap-3 pt-4">
                            <Button
                                id="formation-cancel-btn"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text="Annuler"
                                onClick={() => router.push(Routes.Formations.index)}
                            />
                            <form.Subscribe
                                selector={(s) => [s.canSubmit, s.isSubmitting]}
                            >
                                {([canSubmit, isSubmitting]) => (
                                    <Button
                                        id="formation-submit-btn"
                                        type={EButtonType.primary}
                                        size={EButtonSize.medium}
                                        text={
                                            (() => {
                                                if (isSubmitting || isLoading)
                                                    return 'Enregistrement...';
                                                return isEdit ? 'Modifier' : 'Créer';
                                            })()
                                        }
                                        disabled={!canSubmit || isSubmitting || isLoading}
                                        onClick={() => form.handleSubmit()}
                                    />
                                )}
                            </form.Subscribe>
                        </Div>
                    </form>
                </Div>
            </Div>
        </Div>
    );
};

export default TemplateFormationForm;

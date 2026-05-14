'use client';

import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { Modal, Input, Button } from '@/components/Molecules';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import type { BlogRecord } from '@/lib/blog-api';
import { slugify } from '@/lib/blog-api';
import { Div, Label } from '@/components/Atoms';

export interface BlogFormValues {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl: string;
    tagsText: string;
    publishedAtLocal: string;
    status: 'ACTIVE' | 'INACTIVE';
}

interface BlogFormModalProps {
    mode: 'create' | 'edit';
    blog?: BlogRecord | null;
    onSubmit: (values: BlogFormValues) => Promise<void>;
    isLoading?: boolean;
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string): string | null {
    if (!local?.trim()) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

const BlogFormModal: React.FC<BlogFormModalProps> = ({ mode, blog, onSubmit, isLoading = false }) => {
    const { closeModal } = useCurrentModal();
    const isEdit = mode === 'edit';

    const form = useForm({
        defaultValues: {
            title: blog?.title ?? '',
            slug: blog?.slug ?? '',
            excerpt: blog?.excerpt ?? '',
            content: blog?.content ?? '',
            imageUrl: blog?.imageUrl ?? '',
            tagsText: (blog?.tags ?? []).join(', '),
            publishedAtLocal: toDatetimeLocalValue(blog?.publishedAt),
            status: (blog?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value as BlogFormValues);
            closeModal();
        },
    });

    useEffect(() => {
        if (blog) {
            form.setFieldValue('title', blog.title);
            form.setFieldValue('slug', blog.slug);
            form.setFieldValue('excerpt', blog.excerpt ?? '');
            form.setFieldValue('content', blog.content ?? '');
            form.setFieldValue('imageUrl', blog.imageUrl ?? '');
            form.setFieldValue('tagsText', (blog.tags ?? []).join(', '));
            form.setFieldValue('publishedAtLocal', toDatetimeLocalValue(blog.publishedAt));
            form.setFieldValue('status', blog.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        }
    }, [blog]);

    return (
        <Modal
            title={isEdit ? 'Modifier l’article' : 'Nouvel article'}
            subTitle={isEdit ? 'Mettez à jour le contenu du blog.' : 'Publiez un nouvel article sur le site.'}
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
                className="space-y-4 max-w-full"
            >
                <form.Field
                    name="title"
                    validators={{
                        onSubmit: ({ value }) => (!value?.trim() ? 'Le titre est requis' : undefined),
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            label="Titre"
                            placeholder="Titre de l’article"
                            value={state.value}
                            id="blog-title"
                            onChange={(e) => {
                                const v = e.target.value;
                                handleChange(v);
                                if (!isEdit) {
                                    form.setFieldValue('slug', slugify(v));
                                }
                            }}
                            required
                            hintText={state.meta.errors?.[0]}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>

                <form.Field
                    name="slug"
                    validators={{
                        onSubmit: ({ value }) => (!value?.trim() ? 'Le slug est requis' : undefined),
                    }}
                >
                    {({ state, handleChange }) => (
                        <Input
                            label="Slug (URL)"
                            placeholder="mon-article"
                            value={state.value}
                            id="blog-slug"
                            onChange={(e) => handleChange(e.target.value)}
                            required
                            hintText={state.meta.errors?.[0]}
                            error={!!state.meta.errors?.length}
                        />
                    )}
                </form.Field>

                <form.Field name="excerpt">
                    {({ state, handleChange }) => (
                        <Input
                            label="Résumé"
                            placeholder="Court court extrait affiché sur les cartes"
                            value={state.value}
                            id="blog-excerpt"
                            onChange={(e) => handleChange(e.target.value)}
                            isTextArea
                            rows={3}
                        />
                    )}
                </form.Field>

                <form.Field name="content">
                    {({ state, handleChange }) => (
                        <Input
                            label="Contenu (optionnel)"
                            placeholder="Corps de l’article"
                            value={state.value}
                            id="blog-content"
                            onChange={(e) => handleChange(e.target.value)}
                            isTextArea
                            rows={6}
                        />
                    )}
                </form.Field>

                <form.Field name="imageUrl">
                    {({ state, handleChange }) => (
                        <Input
                            label="Image (URL ou chemin)"
                            placeholder="https://… ou chemin fichier"
                            value={state.value}
                            id="blog-image"
                            onChange={(e) => handleChange(e.target.value)}
                        />
                    )}
                </form.Field>

                <form.Field name="tagsText">
                    {({ state, handleChange }) => (
                        <Div className="flex flex-col gap-2">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                Étiquettes
                            </Label>
                            <Input
                                placeholder="Recherche, UX, Produit (séparées par des virgules)"
                                value={state.value}
                                id="blog-tags"
                                onChange={(e) => handleChange(e.target.value)}
                            />
                        </Div>
                    )}
                </form.Field>

                <form.Field name="publishedAtLocal">
                    {({ state, handleChange }) => (
                        <Input
                            label="Date de publication (optionnel)"
                            type="datetime-local"
                            value={state.value}
                            id="blog-published"
                            onChange={(e) => handleChange(e.target.value)}
                        />
                    )}
                </form.Field>

                <form.Field name="status">
                    {({ state, handleChange }) => (
                        <Div className="flex flex-col gap-2">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                Statut
                            </Label>
                            <select
                                id="blog-status"
                                value={state.value}
                                onChange={(e) => handleChange(e.target.value as 'ACTIVE' | 'INACTIVE')}
                                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="ACTIVE">Actif</option>
                                <option value="INACTIVE">Inactif</option>
                            </select>
                        </Div>
                    )}
                </form.Field>

                <Div className="flex gap-3 pt-4">
                    <Button
                        id="blog-form-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text="Annuler"
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                id="blog-form-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={isSubmitting || isLoading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
                                disabled={!canSubmit || isSubmitting || isLoading}
                                onClick={() => form.handleSubmit()}
                                className="flex-1"
                            />
                        )}
                    </form.Subscribe>
                </Div>
            </form>
        </Modal>
    );
};

export default BlogFormModal;

export { fromDatetimeLocalValue };

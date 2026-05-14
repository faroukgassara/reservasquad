'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { Button, Input } from '@/components/Molecules';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum, EToastType, EVariantLabel } from '@/Enum/Enum';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import BlogFormModal, {
    type BlogFormValues,
    fromDatetimeLocalValue,
} from '@/components/Modals/BlogFormModal/BlogFormModal';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import { Div, Icon, Label, Spinner } from '@/components/Atoms';
import {
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    slugify,
    type BlogRecord,
} from '@/lib/blog-api';

function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR');
}

type ModalState = { type: 'form'; blog: BlogRecord | null } | { type: 'delete'; blog: BlogRecord } | null;

export default function BlogsAdminPage() {
    const [searchValue, setSearchValue] = useState('');
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const [modalState, setModalState] = useState<ModalState>(null);
    const queryClient = useQueryClient();
    const { openToast } = useToast();

    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: fetchBlogs,
    });

    const filtered = blogs.filter(
        (b) =>
            b.title.toLowerCase().includes(searchValue.toLowerCase()) ||
            b.slug.toLowerCase().includes(searchValue.toLowerCase()) ||
            (b.tags ?? []).some((t) => t.toLowerCase().includes(searchValue.toLowerCase()))
    );

    const createMutation = useMutation({
        mutationFn: createBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            openToast('Succès', 'Article créé.', { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateBlog>[1] }) => updateBlog(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            openToast('Succès', 'Article mis à jour.', { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            openToast('Succès', 'Article supprimé.', { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    const handleOpenCreate = () => {
        setModalState({ type: 'form', blog: null });
        openModal();
    };

    const handleOpenEdit = (blog: BlogRecord) => {
        setModalState({ type: 'form', blog });
        openModal();
    };

    const handleOpenDelete = (blog: BlogRecord) => {
        setModalState({ type: 'delete', blog });
        openModal();
    };

    const parseTags = (text: string) =>
        text
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

    const handleFormSubmit = async (values: BlogFormValues) => {
        const tags = parseTags(values.tagsText);
        const publishedAt = fromDatetimeLocalValue(values.publishedAtLocal);
        const slug = (values.slug?.trim() ? values.slug : slugify(values.title)).trim();

        if (modalState?.type === 'form' && modalState.blog) {
            await updateMutation.mutateAsync({
                id: modalState.blog.id,
                body: {
                    title: values.title.trim(),
                    slug,
                    excerpt: values.excerpt.trim() || null,
                    content: values.content.trim() || null,
                    imageUrl: values.imageUrl.trim() || null,
                    tags,
                    publishedAt,
                    status: values.status,
                },
            });
        } else {
            await createMutation.mutateAsync({
                title: values.title.trim(),
                slug,
                excerpt: values.excerpt.trim() || null,
                content: values.content.trim() || null,
                imageUrl: values.imageUrl.trim() || null,
                tags,
                publishedAt,
                status: values.status,
            });
        }
    };

    const handleConfirmDelete = () => {
        if (modalState?.type === 'delete') {
            deleteMutation.mutate(modalState.blog.id);
        }
    };

    const renderModalContent = () => {
        if (modalState?.type === 'form') {
            return (
                <BlogFormModal
                    mode={modalState.blog ? 'edit' : 'create'}
                    blog={modalState.blog}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title="Supprimer l’article"
                    description={`Supprimer « ${modalState.blog.title} » ? Cette action est irréversible.`}
                    submitBtnText="Supprimer"
                    cancelBtnText="Annuler"
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
                    <Spinner color="text-gray-900" size="text-xxl" />
                </Div>
            );
        }
        if (filtered.length === 0) {
            return (
                <Div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-500">
                        {searchValue
                            ? 'Aucun article trouvé'
                            : 'Aucun article. Cliquez sur « Ajouter » pour en créer un.'}
                    </Label>
                </Div>
            );
        }
        return (
            <Div className="space-y-3">
                {filtered.map((blog) => (
                    <Div
                        key={blog.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-gray-300"
                    >
                        <Div className="flex items-center justify-between p-4">
                            <Div className="flex min-w-0 flex-1 items-center gap-4">
                                <Div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                                    <Icon name={IconComponentsEnum.filetext} color="text-primary-600" size="text-large" />
                                </Div>
                                <Div className="min-w-0 flex-1">
                                    <Label
                                        variant={EVariantLabel.bodyLarge}
                                        color="text-gray-900"
                                        className="block truncate font-medium"
                                    >
                                        {blog.title}
                                    </Label>
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-0.5 line-clamp-2">
                                        {(blog.excerpt ?? '').trim() || blog.slug}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.hint}
                                        color="text-gray-400"
                                        className="mt-1 flex items-center gap-1"
                                    >
                                        <Icon name={IconComponentsEnum.info} color="text-gray-400" size="text-small" />
                                        {blog.status === 'ACTIVE' ? 'Actif' : 'Inactif'} · {formatRelativeTime(blog.updatedAt)}
                                    </Label>
                                </Div>
                            </Div>
                            <Div className="ml-4 flex shrink-0 items-center gap-2">
                                <Button
                                    id={`blog-edit-${blog.id}`}
                                    type={EButtonType.iconButton}
                                    icon={{ name: IconComponentsEnum.edit, color: 'text-gray-600', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenEdit(blog)}
                                    className="hover:bg-gray-100 hover:text-primary-600"
                                />
                                <Button
                                    id={`blog-delete-${blog.id}`}
                                    type={EButtonType.iconButton}
                                    icon={{ name: IconComponentsEnum.archive, color: 'text-gray-600', size: ESize.md }}
                                    iconPosition="only"
                                    size={EButtonSize.medium}
                                    onClick={() => handleOpenDelete(blog)}
                                    className="hover:bg-danger-50 hover:text-danger-600"
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
                title="Blog"
                subTitle="Rédigez les articles affichés sur le site."
                rightActions={
                    <Button
                        id="blog-add-btn"
                        icon={{ name: IconComponentsEnum.plus, color: 'text-white', size: ESize.md }}
                        text="Ajouter"
                        iconPosition="left"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        onClick={handleOpenCreate}
                    />
                }
                mainSection={
                    <Div className="min-h-full">
                        <Div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                {filtered.length} article{filtered.length === 1 ? '' : 's'}
                            </Label>
                            <Div className="flex max-w-sm flex-1 items-center gap-3">
                                <Input
                                    id="blog-search"
                                    placeholder="Rechercher…"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    leftIcon={IconComponentsEnum.search}
                                    containerClassName="flex-1"
                                    className="border-gray-200"
                                />
                            </Div>
                        </Div>

                        {renderList()}
                    </Div>
                }
            />
        </>
    );
}

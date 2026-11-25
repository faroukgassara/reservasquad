'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import {
    createChargeCategory,
    deleteChargeCategory,
    fetchChargeCategories,
    updateChargeCategory,
    type ChargeCategory,
} from '@/lib/daily-income-api';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

interface ChargeCategoriesManageModalProps {
    onClose: () => void;
    onCreated?: (category: ChargeCategory) => void;
}

export default function ChargeCategoriesManageModal({
    onClose,
    onCreated,
}: Readonly<ChargeCategoriesManageModalProps>) {
    const t = useTranslations('admin.dailyIncome');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const queryClient = useQueryClient();

    const [newName, setNewName] = useState('');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['charge-categories'],
        queryFn: fetchChargeCategories,
    });

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return categories;
        return categories.filter((category) => category.name.toLowerCase().includes(query));
    }, [categories, search]);

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ['charge-categories'] });
        void queryClient.invalidateQueries({ queryKey: ['income-lines'] });
    };

    const createMutation = useMutation({
        mutationFn: () => createChargeCategory({ name: newName.trim() }),
        onSuccess: (created) => {
            setNewName('');
            invalidate();
            onCreated?.(created);
            openToast(tCommon('success'), t('categoryCreated'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            updateChargeCategory(id, { name }),
        onSuccess: () => {
            setEditingId(null);
            setEditingName('');
            invalidate();
            openToast(tCommon('success'), t('categoryUpdated'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteChargeCategory(id),
        onSuccess: (_, id) => {
            setConfirmingDeleteId(null);
            queryClient.setQueryData<ChargeCategory[]>(['charge-categories'], (current) =>
                current?.filter((category) => category.id !== id),
            );
            invalidate();
            openToast(tCommon('success'), t('categoryDeleted'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) =>
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
    });

    const startEdit = (category: ChargeCategory) => {
        setConfirmingDeleteId(null);
        setEditingId(category.id);
        setEditingName(category.name);
    };

    const busy =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <Div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
            <Div
                role="dialog"
                aria-modal="true"
                aria-labelledby="charge-categories-title"
                className="flex max-h-[min(80dvh,560px)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
            >
                <Div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <Div className="flex min-w-0 flex-col gap-0.5">
                        <Label variant={EVariantLabel.h6} color="text-gray-900" className="font-bold!">
                            <span id="charge-categories-title">{t('manageCategories')}</span>
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {t('manageCategoriesHint')}
                        </Label>
                    </Div>
                    <Icon
                        name={IconComponentsEnum.close}
                        size={ESize.sm}
                        color="text-gray-500"
                        handleClick={onClose}
                        className="cursor-pointer"
                    />
                </Div>

                <Div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4">
                    <Input
                        id="charge-category-new"
                        label={t('addCategory')}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        disabled={busy}
                    />
                    <Button
                        id="charge-category-add"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={t('addCategoryAction')}
                        isLoading={createMutation.isPending}
                        disabled={!newName.trim()}
                        onClick={() => createMutation.mutate()}
                        className="w-full justify-center"
                    />
                </Div>

                <Div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
                    {!isLoading && categories.length > 0 ? (
                        <Div className="mb-3">
                            <Input
                                id="charge-category-search"
                                label={tCommon('search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftIcon="search"
                                placeholder={t('searchCategories')}
                            />
                        </Div>
                    ) : null}

                    {isLoading ? (
                        <Div className="flex justify-center py-8">
                            <Spinner size={ESize.lg} color="text-primary-500" />
                        </Div>
                    ) : null}

                    {!isLoading && categories.length === 0 ? (
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="block py-6 text-center">
                            {t('noCategories')}
                        </Label>
                    ) : null}

                    {!isLoading && categories.length > 0 && filteredCategories.length === 0 ? (
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="block py-6 text-center">
                            {t('noCategoriesMatch')}
                        </Label>
                    ) : null}

                    <ul className="flex flex-col gap-2">
                        {filteredCategories.map((category) => {
                            const isEditing = editingId === category.id;
                            if (confirmingDeleteId === category.id) {
                                return (
                                    <li
                                        key={category.id}
                                        className="flex flex-col gap-2.5 rounded-xl border border-danger-200 bg-danger-25 px-3 py-2.5"
                                    >
                                        <Div className="flex items-start gap-2">
                                            <Icon
                                                name={IconComponentsEnum.trash}
                                                size={ESize.sm}
                                                color="text-danger-600"
                                                className="mt-0.5 shrink-0"
                                            />
                                            <Label variant={EVariantLabel.bodySmall} color="text-danger-700" className="font-medium">
                                                {t('deleteCategoryConfirm', { name: category.name })}
                                            </Label>
                                        </Div>
                                        <Div className="flex justify-end gap-2">
                                            <Button
                                                id={`charge-category-delete-cancel-${category.id}`}
                                                type={EButtonType.tertiary}
                                                size={EButtonSize.small}
                                                text={tCommon('cancel')}
                                                disabled={deleteMutation.isPending}
                                                onClick={() => setConfirmingDeleteId(null)}
                                            />
                                            <Button
                                                id={`charge-category-delete-confirm-${category.id}`}
                                                type={EButtonType.primary}
                                                size={EButtonSize.small}
                                                text={tCommon('delete')}
                                                isLoading={deleteMutation.isPending}
                                                onClick={() => deleteMutation.mutate(category.id)}
                                                className="bg-danger-600! hover:bg-danger-700!"
                                            />
                                        </Div>
                                    </li>
                                );
                            }
                            if (isEditing) {
                                return (
                                    <li
                                        key={category.id}
                                        className="flex flex-col gap-2.5 rounded-xl border border-primary-100 bg-gray-25 px-3 py-2.5"
                                    >
                                        <Input
                                            id={`charge-category-edit-${category.id}`}
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            disabled={busy}
                                        />
                                        <Div className="flex justify-end gap-2">
                                            <Button
                                                id={`charge-category-cancel-${category.id}`}
                                                type={EButtonType.tertiary}
                                                size={EButtonSize.small}
                                                text={tCommon('cancel')}
                                                disabled={busy}
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditingName('');
                                                }}
                                            />
                                            <Button
                                                id={`charge-category-save-${category.id}`}
                                                type={EButtonType.primary}
                                                size={EButtonSize.small}
                                                text={tCommon('save')}
                                                isLoading={updateMutation.isPending}
                                                disabled={!editingName.trim()}
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        id: category.id,
                                                        name: editingName.trim(),
                                                    })
                                                }
                                            />
                                        </Div>
                                    </li>
                                );
                            }
                            return (
                                <li
                                    key={category.id}
                                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-25 px-3 py-2"
                                >
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-gray-900"
                                        className="min-w-0 flex-1 truncate font-medium"
                                    >
                                        {category.name}
                                    </Label>
                                    <Div className="flex shrink-0 items-center gap-1">
                                        <Icon
                                            name={IconComponentsEnum.edit}
                                            size={ESize.sm}
                                            color="text-gray-600"
                                            handleClick={() => startEdit(category)}
                                            className="cursor-pointer"
                                        />
                                        <Icon
                                            name={IconComponentsEnum.trash}
                                            size={ESize.sm}
                                            color="text-danger-600"
                                            handleClick={() => {
                                                setEditingId(null);
                                                setConfirmingDeleteId(category.id);
                                            }}
                                            className="cursor-pointer"
                                        />
                                    </Div>
                                </li>
                            );
                        })}
                    </ul>
                </Div>

                <Div className="border-t border-gray-100 px-5 py-4">
                    <Button
                        id="charge-categories-done"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('close')}
                        onClick={onClose}
                        className="w-full justify-center"
                    />
                </Div>
            </Div>
        </Div>,
        document.body,
    );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { TemplateFormationForm } from '@/components/Templates';
import { Button } from '@/components/Molecules';
import { EButtonSize, EButtonType, EToastType } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { useToast } from '@/contexts/ToastContext';
import type { FormationFormValues } from '@/components/Templates/TemplateFormationForm/TemplateFormationForm';
import {
    fetchFormation,
    fetchFormationCategories,
    createFormationCategory,
    updateFormation,
} from '@/lib/formation-api';

export default function EditFormationPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
    const router = useRouter();
    const { openToast } = useToast();

    const { data: formation, isLoading } = useQuery({
        queryKey: ['formation', id],
        queryFn: () => fetchFormation(id),
        enabled: !!id,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['formation-categories'],
        queryFn: fetchFormationCategories,
        enabled: true,
    });

    const queryClient = useQueryClient();

    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => createFormationCategory({ name }),
        onSuccess: (newCategory) => {
            queryClient.setQueryData(
                ['formation-categories'],
                (old: typeof categories) =>
                    old ? [...old, newCategory] : [newCategory]
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: FormationFormValues) =>
            updateFormation(id, {
                title: values.title,
                description: values.description,
                duration: values.duration,
                price: values.price,
                status: values.status,
                categoryId: values.categoryId || undefined,
                imageUrl: values.imageUrl || undefined,
            }),
        onSuccess: () => {
            openToast('Succès', 'Formation modifiée avec succès.', {
                type: EToastType.SUCCESS,
            });
            router.push(Routes.Formations.index);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    if (isLoading || !formation) {
        return (
            <LayoutWrapper
                title="Chargement..."
                subTitle=""
                mainSection={
                    <div className="min-h-full flex items-center justify-center">
                        <div className="animate-pulse text-gray-500">
                            Chargement...
                        </div>
                    </div>
                }
            />
        );
    }

    return (
        <LayoutWrapper
            title={formation.title}
            subTitle="Modifiez les informations de la formation."
            leftActions={
                <button
                    type="button"
                    onClick={() => router.push(Routes.Formations.index)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
            }
            rightActions={
                <Button
                    id="formation-export-btn"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text="Exporter"
                    onClick={() => console.log('Export')}
                />
            }
            mainSection={
                <TemplateFormationForm
                    mode="edit"
                    initialValues={{
                        title: formation.title,
                        description: formation.description ?? '',
                        duration: formation.duration,
                        price: Number(formation.price),
                        status: formation.status,
                        categoryId: formation.categoryId ?? '',
                        imageUrl: formation.imageUrl ?? '',
                    }}
                    categories={categories}
                    onCategoryAdded={() => {}}
                    onCreateCategory={(name) =>
                        createCategoryMutation.mutateAsync(name)
                    }
                    onSubmit={(values) => updateMutation.mutateAsync(values)}
                    isLoading={updateMutation.isPending}
                />
            }
        />
    );
}

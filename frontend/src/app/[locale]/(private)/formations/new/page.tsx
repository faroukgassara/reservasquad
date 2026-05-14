'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import { TemplateFormationForm } from '@/components/Templates';
import { Routes } from '@/lib/routes';
import { useToast } from '@/contexts/ToastContext';
import { EToastType } from '@/Enum/Enum';
import type { FormationFormValues } from '@/components/Templates/TemplateFormationForm/TemplateFormationForm';
import {
    fetchFormationCategories,
    createFormationCategory,
    createFormation,
} from '@/lib/formation-api';

export default function NewFormationPage() {
    const router = useRouter();
    const { openToast } = useToast();
    const queryClient = useQueryClient();

    const { data: categories = [] } = useQuery({
        queryKey: ['formation-categories'],
        queryFn: fetchFormationCategories,
        enabled: true,
    });

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

    const createMutation = useMutation({
        mutationFn: (values: FormationFormValues) =>
            createFormation({
                title: values.title,
                description: values.description,
                duration: values.duration,
                price: values.price,
                status: values.status,
                categoryId: values.categoryId,
                imageUrl: values.imageUrl,
            }),
        onSuccess: () => {
            openToast('Succès', 'Formation créée avec succès.', {
                type: EToastType.SUCCESS,
            });
            router.push(Routes.Formations.index);
        },
        onError: (error: Error) => {
            openToast('Erreur', error.message, { type: EToastType.ERROR });
        },
    });

    return (
        <LayoutWrapper
            title="Nouvelle formation"
            subTitle="Créez une nouvelle formation."
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
            mainSection={
                <TemplateFormationForm
                    mode="create"
                    categories={categories}
                    onCategoryAdded={() => {}}
                    onCreateCategory={(name) =>
                        createCategoryMutation.mutateAsync(name)
                    }
                    onSubmit={(values) => createMutation.mutateAsync(values)}
                    isLoading={createMutation.isPending}
                />
            }
        />
    );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismPosProductForm, { type PosProductFormValues } from '@/components/Organisms/Pos/OrganismPosProductForm';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Routes } from '@/lib/routes';
import {
    createPosProduct,
    deletePosProduct,
    fetchPosCategories,
    fetchPosProduct,
    updatePosProduct,
    type PosProductInput,
} from '@/lib/pos-api';
import { EButtonSize, EButtonType, ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum';

const NEW_PRODUCT_ID = 'new';

function toInput(values: PosProductFormValues, keepImage: string | null): PosProductInput {
    const input: PosProductInput = {
        name: values.name.trim(),
        categoryId: values.categoryId || null,
        price: Number(values.price.replace(',', '.')),
        cost: Number(values.cost.replace(',', '.')) || 0,
        type: values.type,
        availableInPos: values.availableInPos && !values.isSubscription,
        barcode: values.barcode.trim() || null,
        reference: values.reference.trim() || null,
        taxRate: Number(values.taxRate) || 0,
        subscriptionDuration: values.isSubscription ? Number(values.subscriptionDuration) : null,
        subscriptionUnit: values.isSubscription ? 'DAY' : null,
    };
    if (values.imageUrl !== keepImage) input.imageUrl = values.imageUrl || null;
    return input;
}

export default function PosProductPage() {
    const t = useTranslations('pos.products');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const isNew = params.id === NEW_PRODUCT_ID;
    const productId = isNew ? null : params.id;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const { openModal, closeModal, modalPortal } = useModal();

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['pos-product', productId],
        queryFn: () => fetchPosProduct(productId!),
        enabled: !!productId,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['pos-categories'],
        queryFn: fetchPosCategories,
    });

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-products-available'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-categories'] });
        void queryClient.invalidateQueries({ queryKey: ['pos-product', productId] });
    };

    const onError = (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR });

    const saveMutation = useMutation({
        mutationFn: (body: PosProductInput) => (productId ? updatePosProduct(productId, body) : createPosProduct(body)),
        onSuccess: (saved) => {
            invalidate();
            openToast(tCommon('success'), tCommon('save'), { type: EToastType.SUCCESS });
            if (isNew) router.replace(Routes.Pos.product(saved.id));
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePosProduct,
        onSuccess: () => {
            invalidate();
            openToast(tCommon('success'), tCommon('delete'), { type: EToastType.SUCCESS });
            closeModal();
            router.push(Routes.Pos.products);
        },
        onError,
    });

    const backButton = (
        <Button
            id="pos-product-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.products)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    const deleteButton =
        isAdmin && product ? (
            <Button
                id="pos-product-delete"
                type={EButtonType.secondary}
                size={EButtonSize.medium}
                iconPosition="left"
                icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                text={tCommon('delete')}
                onClick={() => openModal()}
            />
        ) : null;

    const isLoading = productLoading || categoriesLoading;

    return (
        <>
            {modalPortal(
                product ? (
                    <ConfirmationModal
                        title={tCommon('delete')}
                        description={t('deleteConfirm')}
                        submitBtnText={tCommon('delete')}
                        cancelBtnText={tCommon('cancel')}
                        onSubmit={() => deleteMutation.mutate(product.id)}
                        isLoading={deleteMutation.isPending}
                        icon={IconComponentsEnum.info}
                        iconBgColor="bg-danger-100"
                        iconColor="text-danger-600"
                    />
                ) : null,
            )}
            <LayoutWrapper
                title={isNew ? t('create') : (product?.name ?? '…')}
                subTitle={t('subtitle')}
                leftActions={backButton}
                rightActions={deleteButton}
                mainSection={
                    isLoading ? (
                        <Div className="flex justify-center py-16">
                            <Spinner size={ESize.lg} color="text-primary-500" />
                        </Div>
                    ) : (
                        <OrganismPosProductForm
                            key={product?.id ?? NEW_PRODUCT_ID}
                            product={product ?? null}
                            categories={categories}
                            onSubmit={async (values) => {
                                await saveMutation.mutateAsync(toInput(values, product ? (product.imageUrl ?? '') : null));
                            }}
                            onCancel={() => router.push(Routes.Pos.products)}
                            isLoading={saveMutation.isPending}
                        />
                    )
                }
            />
        </>
    );
}

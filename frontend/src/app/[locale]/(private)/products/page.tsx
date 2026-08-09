'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, EBadgeType, IconComponentsEnum, EToastType, ESize, EBadgeSize } from '@/Enum/Enum';
import { fetchProducts, fetchProductCategories, createProduct, updateProduct, deleteProduct, formatProductMoney, type ProductRecord } from '@/lib/product-api';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import ProductFormModal, { type ProductFormValues } from '@/components/Modals/ProductFormModal/ProductFormModal';
import ProductFilterModal, { type ProductFilters } from '@/components/Modals/ProductFilterModal/ProductFilterModal';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import { ITableAction, ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

type ModalState =
    | { type: 'form'; product: ProductRecord | null }
    | { type: 'delete'; product: ProductRecord }
    | { type: 'filter' }
    | null;

export default function ProductsAdminPage() {
    const t = useTranslations('admin.products');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');
    const locale = useLocale();

    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [modalState, setModalState] = useState<ModalState>(null);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>();
    const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>();

    const queryClient = useQueryClient();
    const { openModal, closeModal, modalPortal } = useModal({
        closeCallBack: () => setModalState(null),
    });
    const { openToast } = useToast();

    const { data: categories = [] } = useQuery({
        queryKey: ['product-categories'],
        queryFn: fetchProductCategories,
        enabled: true,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['products', page, searchValue, sortBy, sortOrder, statusFilter, categoryFilter, featuredFilter],
        queryFn: () =>
            fetchProducts({
                page,
                perPage: 10,
                search: searchValue || undefined,
                sortBy,
                sortOrder,
                status: statusFilter,
                categoryIds: categoryFilter?.length ? categoryFilter : undefined,
                featured: featuredFilter,
            }),
        enabled: true,
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            openToast(tCommon('success'), t('toasts.created'), { type: EToastType.SUCCESS });
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProduct>[1] }) =>
            updateProduct(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            openToast(tCommon('success'), t('toasts.updated'), { type: EToastType.SUCCESS });
            setModalState(null);
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            openToast(tCommon('success'), t('toasts.deleted'), { type: EToastType.SUCCESS });
            setModalState(null);
            closeModal();
        },
        onError: (error: Error) => {
            openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
        },
    });

    const rows = data?.data ?? [];
    const totalRows = data?.meta?.total ?? 0;

    const filterTags = useMemo(() => {
        const tags: string[] = [];
        if (statusFilter) {
            const label = statusFilter === 'ACTIVE' ? tStatus('active') : tStatus('inactive');
            tags.push(`${t('columns.status')}: ${label}`);
        }
        if (categoryFilter?.length) {
            const names = categoryFilter
                .map((id) => categories.find((c) => c.id === id)?.name ?? id)
                .join(', ');
            tags.push(`${t('columns.category')}: ${names}`);
        }
        if (featuredFilter !== undefined) {
            tags.push(`${t('columns.featured')}: ${featuredFilter ? t('featuredYes') : t('featuredNo')}`);
        }
        return tags;
    }, [statusFilter, categoryFilter, featuredFilter, categories, t, tStatus]);

    const handleRemoveTag = (tag: string) => {
        if (tag.startsWith(`${t('columns.status')}:`)) setStatusFilter(undefined);
        else if (tag.startsWith(`${t('columns.category')}:`)) setCategoryFilter([]);
        else if (tag.startsWith(`${t('columns.featured')}:`)) setFeaturedFilter(undefined);
        setPage(1);
    };

    const handleResetFilters = () => {
        setStatusFilter(undefined);
        setCategoryFilter([]);
        setFeaturedFilter(undefined);
        setPage(1);
    };

    const openFilterDrawer = useCallback(() => {
        setModalState({ type: 'filter' });
        openModal();
    }, [openModal]);

    const toApiBody = (values: ProductFormValues) => {
        const discountedRaw = values.discountedPrice.trim();
        const discountedPrice = discountedRaw === '' ? null : Number(discountedRaw);
        return {
            title: values.title.trim(),
            description: values.description.trim() || undefined,
            price: Number(values.price),
            discountedPrice:
                discountedPrice != null && !Number.isNaN(discountedPrice) ? discountedPrice : null,
            images: values.images,
            imageUrl: values.images[0] || undefined,
            categoryId: values.categoryId || null,
            badges: values.badges,
            materials: values.materials,
            sizes: values.sizes,
            hasEngraving: values.hasEngraving,
            featured: values.featured,
            status: values.status,
        };
    };

    const handleFormSubmit = async (values: ProductFormValues) => {
        const body = toApiBody(values);
        if (modalState?.type === 'form' && modalState.product) {
            await updateMutation.mutateAsync({ id: modalState.product.id, body });
        } else {
            await createMutation.mutateAsync(body);
        }
    };

    const columns = useMemo(
        (): ITableColumn<ProductRecord>[] => [
            {
                headerElement: {
                    value: 'title',
                    label: t('columns.title'),
                    sortable: true,
                    width: '220px',
                    render: (_: unknown, row: ProductRecord) => (
                        <OrganismTable.Cell mainText={row.title} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'category',
                    label: t('columns.category'),
                    render: (_: unknown, row: ProductRecord) => (
                        <OrganismTable.Cell mainText={row.category?.name ?? '—'} />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'price',
                    label: t('columns.price'),
                    sortable: true,
                    render: (_: unknown, row: ProductRecord) => (
                        <OrganismTable.Cell
                            mainText={formatProductMoney(
                                row.discountedPrice ?? row.price,
                                locale,
                            )}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('columns.status'),
                    sortable: true,
                    render: (val: string) => (
                        <Badge
                            id={`product-status-${val}`}
                            text={val === 'ACTIVE' ? tStatus('active') : tStatus('inactive')}
                            type={val === 'ACTIVE' ? EBadgeType.success : EBadgeType.error}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'badges',
                    label: t('columns.badges'),
                    render: (_: unknown, row: ProductRecord) => (
                        <OrganismTable.Cell
                            mainText={row.badges?.length ? row.badges.join(', ') : '—'}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: 'featured',
                    label: t('columns.featured'),
                    render: (val: boolean) => (
                        <Badge
                            id={`product-featured-${val}`}
                            text={val ? t('featuredYes') : t('featuredNo')}
                            type={val ? EBadgeType.success : EBadgeType.error}
                            size={EBadgeSize.small}
                        />
                    ),
                },
            },
        ],
        [t, tStatus, locale],
    );

    const actions: ITableAction<ProductRecord>[] = useMemo(
        () => [
            {
                label: tCommon('edit'),
                iconName: IconComponentsEnum.edit,
                onClick: (row) => {
                    setModalState({ type: 'form', product: row });
                    openModal();
                },
            },
            {
                label: tCommon('delete'),
                iconName: IconComponentsEnum.close,
                onClick: (row) => {
                    setModalState({ type: 'delete', product: row });
                    openModal();
                },
            },
        ],
        [openModal, tCommon],
    );

    const renderModalContent = () => {
        if (modalState?.type === 'filter') {
            return (
                <ProductFilterModal
                    filters={{ status: statusFilter, categoryIds: categoryFilter, featured: featuredFilter }}
                    categories={categories}
                    onApply={(filters: ProductFilters) => {
                        setStatusFilter(filters.status);
                        setCategoryFilter(filters.categoryIds);
                        setFeaturedFilter(filters.featured);
                        setPage(1);
                        closeModal();
                        setModalState(null);
                    }}
                    onReset={() => {
                        handleResetFilters();
                        closeModal();
                        setModalState(null);
                    }}
                />
            );
        }
        if (modalState?.type === 'form') {
            return (
                <ProductFormModal
                    mode={modalState.product ? 'edit' : 'create'}
                    product={modalState.product}
                    categories={categories}
                    onSubmit={handleFormSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            );
        }
        if (modalState?.type === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('confirmDelete')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate(modalState.product.id)}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        return <Div />;
    };

    return (
        <>
            {modalPortal(renderModalContent())}

            <LayoutWrapper
                title={t('title')}
                subTitle={t('subtitle')}
                mainSection={
                    <div className="min-h-full">
                        <OrganismTable<ProductRecord>
                            columns={columns}
                            rows={rows}
                            pageSize={10}
                            searchable
                            searchValue={searchValue}
                            onSearchChange={(v) => {
                                setSearchValue(v);
                                setPage(1);
                            }}
                            placeholder={t('search')}
                            primaryAction={
                                <Button
                                    id="product-add-btn"
                                    icon={{
                                        name: IconComponentsEnum.plus,
                                        color: 'text-white',
                                        size: ESize.md,
                                    }}
                                    text={t('add')}
                                    iconPosition="left"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    onClick={() => {
                                        setModalState({ type: 'form', product: null });
                                        openModal();
                                    }}
                                />
                            }
                            actions={actions}
                            isLoading={isLoading}
                            emptyMessage={t('empty')}
                            page={page}
                            totalRows={totalRows}
                            onPageChange={setPage}
                            sortConfig={{ key: sortBy, direction: sortOrder }}
                            onSort={(key, direction) => {
                                setSortBy(key);
                                setSortOrder(direction);
                                setPage(1);
                            }}
                            filterTags={filterTags}
                            onRemoveTag={handleRemoveTag}
                            onReset={handleResetFilters}
                            onClickFilter={openFilterDrawer}
                        />
                    </div>
                }
            />
        </>
    );
}

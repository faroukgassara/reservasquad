'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerScrollContent, DrawerActions } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import type { ProductCategory } from '@/lib/product-api';

export interface ProductFilters {
    status?: string;
    categoryIds?: string[];
    featured?: boolean;
}

interface ProductFilterModalProps {
    filters: ProductFilters;
    categories: ProductCategory[];
    onApply: (filters: ProductFilters) => void;
    onReset: () => void;
}

export default function ProductFilterModal({
    filters,
    categories,
    onApply,
    onReset,
}: Readonly<ProductFilterModalProps>) {
    const t = useTranslations('admin.products');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const [draftStatus, setDraftStatus] = useState(filters.status);
    const [draftCategories, setDraftCategories] = useState<string[]>(filters.categoryIds ?? []);
    const [draftFeatured, setDraftFeatured] = useState(filters.featured);

    const statusOptions: { value: string; label: string; type: EBadgeType }[] = [
        { value: 'ACTIVE', label: tStatus('active'), type: EBadgeType.success },
        { value: 'INACTIVE', label: tStatus('inactive'), type: EBadgeType.error },
    ];

    const featuredOptions: { value: boolean; label: string; type: EBadgeType }[] = [
        { value: true, label: t('featuredYes'), type: EBadgeType.success },
        { value: false, label: t('featuredNo'), type: EBadgeType.error },
    ];

    const categoryDropdownOptions = categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));

    const handleReset = () => {
        setDraftStatus(undefined);
        setDraftCategories([]);
        setDraftFeatured(undefined);
        onReset();
    };

    const handleApply = () => {
        onApply({
            status: draftStatus,
            categoryIds: draftCategories.length > 0 ? draftCategories : undefined,
            featured: draftFeatured,
        });
    };

    return (
        <Modal
            title={tCommon('filter')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerScrollContent className="gap-0 space-y-6 p-6">
                {/* Status */}
                <Div className="flex flex-col gap-3">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                        {t('columns.status')}
                    </Label>
                    <Div className="flex flex-wrap gap-2">
                        {statusOptions.map((opt) => (
                            <Badge
                                key={opt.value}
                                id={`filter-status-${opt.value}`}
                                text={opt.label}
                                size={EBadgeSize.small}
                                type={draftStatus === opt.value ? opt.type : EBadgeType.primary}
                                className={
                                    draftStatus === opt.value
                                        ? ''
                                        : 'border border-gray-200 bg-white! text-gray-600!'
                                }
                                onClick={() =>
                                    setDraftStatus(draftStatus === opt.value ? undefined : opt.value)
                                }
                            />
                        ))}
                    </Div>
                </Div>

                {/* Category — multiselect dropdown */}
                {categories.length > 0 && (
                    <Div className="flex flex-col gap-3">
                        <Dropdown
                            label={t('columns.category')}
                            options={categoryDropdownOptions}
                            value={draftCategories}
                            onChange={(value) => {
                                const arr = Array.isArray(value)
                                    ? (value as string[])
                                    : [value as string];
                                setDraftCategories(arr);
                            }}
                            placeholder={t('columns.category')}
                            searchable
                        />
                    </Div>
                )}

                {/* Featured */}
                <Div className="flex flex-col gap-3">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                        {t('columns.featured')}
                    </Label>
                    <Div className="flex flex-wrap gap-2">
                        {featuredOptions.map((opt) => (
                            <Badge
                                key={String(opt.value)}
                                id={`filter-featured-${opt.value}`}
                                text={opt.label}
                                size={EBadgeSize.small}
                                type={draftFeatured === opt.value ? opt.type : EBadgeType.primary}
                                className={
                                    draftFeatured === opt.value
                                        ? ''
                                        : 'border border-gray-200 bg-white! text-gray-600!'
                                }
                                onClick={() =>
                                    setDraftFeatured(
                                        draftFeatured === opt.value ? undefined : opt.value,
                                    )
                                }
                            />
                        ))}
                    </Div>
                </Div>
            </DrawerScrollContent>

            <DrawerActions>
                <Button
                    id="filter-reset"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text={tCommon('reset')}
                    onClick={handleReset}
                    className="flex-1"
                />
                <Button
                    id="filter-apply"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={tCommon('apply')}
                    onClick={handleApply}
                    className="flex-1"
                />
            </DrawerActions>
        </Modal>
    );
}

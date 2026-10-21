'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Toggle from '@/components/Primitives/Toggle/Toggle';
import { useCurrentModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import type { InventoryExportLabels } from '@/lib/export-inventory';
import {
    fetchPosCategories,
    fetchPosProductsInventory,
    type PosCategory,
    type PosProduct,
} from '@/lib/pos-api';
import {
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EToggleSize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

const ALL = 'all';

interface PosExportInventoryModalProps {
    initialCategoryId?: string;
    categories?: PosCategory[];
}

export default function PosExportInventoryModal({
    initialCategoryId,
    categories: initialCategories,
}: Readonly<PosExportInventoryModalProps>) {
    const t = useTranslations('pos.products');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const { openToast } = useToast();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        initialCategoryId && initialCategoryId !== ALL ? initialCategoryId : ALL,
    );
    const [stockableOnly, setStockableOnly] = useState<boolean>(true);
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
    const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

    // Fetch categories if not passed
    const { data: fetchedCategories = [] } = useQuery({
        queryKey: ['pos-categories'],
        queryFn: fetchPosCategories,
        enabled: !initialCategories || initialCategories.length === 0,
    });
    const categories = initialCategories?.length ? initialCategories : fetchedCategories;

    // Fetch products matching the current inventory filter
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['pos-inventory-export-preview', selectedCategoryId, stockableOnly],
        queryFn: () =>
            fetchPosProductsInventory({
                categoryId: selectedCategoryId === ALL ? undefined : selectedCategoryId,
                stockableOnly,
            }),
    });

    const categoryOptions = [
        { value: ALL, label: t('allCategories') },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
    ];

    const selectedCategoryName =
        selectedCategoryId === ALL ? undefined : categories.find((c) => c.id === selectedCategoryId)?.name;

    const labels: InventoryExportLabels = {
        title: t('exportInventoryTitle'),
        subtitle: t('exportInventorySubtitle'),
        scope: selectedCategoryName || t('exportScope'),
        date: tCommon('date'),
        image: 'Image',
        productName: t('name'),
        stock: 'Stock',
        category: t('category'),
        totalProducts: t('totalProducts'),
        totalUnits: t('totalUnits'),
        totalCostValue: t('totalCostValue'),
        totalRetailValue: t('totalRetailValue'),
        reference: t('reference'),
        type: t('type'),
        stockable: t('typeStockable'),
        consumable: t('typeConsumable'),
        unitCost: t('cost'),
        unitPrice: t('price'),
        theoreticalStock: t('theoreticalStock'),
        physicalStock: t('physicalStock'),
        discrepancy: t('discrepancy'),
        stockCostValue: t('stockCostValue'),
        empty: t('exportEmpty'),
        auditor: t('auditor'),
        verifier: t('verifier'),
        signature: t('signature'),
        notes: tCommon('notes'),
        page: t('pageLabel'),
        of: t('ofLabel'),
    };

    const handleExportPdf = async () => {
        if (products.length === 0) {
            openToast(tCommon('warning'), t('exportEmpty'), { type: EToastType.WARNING });
            return;
        }
        setIsExportingPdf(true);
        try {
            const { exportInventoryPdf } = await import('@/lib/export-inventory');
            await exportInventoryPdf({
                products,
                categoryFilterName: selectedCategoryName,
                stockableOnly,
                labels,
            });
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
        } catch {
            openToast(tCommon('error'), 'Export failed', { type: EToastType.ERROR });
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportCsv = async () => {
        if (products.length === 0) {
            openToast(tCommon('warning'), t('exportEmpty'), { type: EToastType.WARNING });
            return;
        }
        setIsExportingCsv(true);
        try {
            const { exportInventoryCsv } = await import('@/lib/export-inventory');
            exportInventoryCsv({
                products,
                categoryFilterName: selectedCategoryName,
                labels,
            });
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
        } catch {
            openToast(tCommon('error'), 'Export failed', { type: EToastType.ERROR });
        } finally {
            setIsExportingCsv(false);
        }
    };

    return (
        <Modal
            title={t('exportInventoryTitle')}
            subTitle={t('exportInventorySubtitle')}
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,620px)]"
        >
            <Div className="space-y-5">
                {/* Filter Options */}
                <Div className="rounded-2xl border border-gray-200/80 bg-gray-25/80 p-4 space-y-3">
                    <Div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Div className="min-w-0 flex-1">
                            <Label variant={EVariantLabel.caption} color="text-gray-600" className="mb-1 block font-medium">
                                {t('category')}
                            </Label>
                            <Dropdown
                                leftIcon="filter"
                                options={categoryOptions}
                                value={selectedCategoryId}
                                onChange={(val) => {
                                    if (typeof val === 'string') setSelectedCategoryId(val);
                                }}
                                className="w-full"
                            />
                        </Div>

                        <Div className="flex items-center gap-2 pt-2 sm:pt-4">
                            <Toggle
                                id="pos-export-stockable-toggle"
                                checked={stockableOnly}
                                onChange={setStockableOnly}
                                size={EToggleSize.sm}
                            />
                            <Label
                                variant={EVariantLabel.caption}
                                color="text-gray-700"
                                className="cursor-pointer font-medium select-none"
                            >
                                {t('stockableOnlyFilter')}
                            </Label>
                        </Div>
                    </Div>
                </Div>

                {!isLoading && products.length === 0 ? (
                    <Div className="rounded-xl border border-dashed border-gray-200 bg-white py-6 text-center">
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                            {t('exportEmpty')}
                        </Label>
                    </Div>
                ) : null}

                {/* Export Action Options */}
                <Div className="grid gap-3 pt-2 sm:grid-cols-2">
                    {/* PDF Card */}
                    <Div className="flex flex-col justify-between rounded-2xl border-2 border-primary-200/80 bg-gradient-to-br from-primary-50/60 via-white to-white p-4 shadow-2xs transition-all hover:border-primary-400">
                        <Div className="space-y-1.5">
                            <Div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
                                    <Icon name={IconComponentsEnum.filetext} size={ESize.xs} color="text-white" />
                                </div>
                                <span className="font-bold text-sm text-gray-900">{t('exportPdf')}</span>
                            </Div>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('exportPdfDesc')}</p>
                        </Div>
                        <Div className="mt-4">
                            <Button
                                id="pos-export-inventory-pdf-btn"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={isExportingPdf ? tCommon('loading') : t('downloadPdf')}
                                isLoading={isExportingPdf}
                                disabled={isLoading || products.length === 0}
                                onClick={handleExportPdf}
                                className="w-full justify-center"
                                iconPosition="left"
                                icon={{
                                    name: IconComponentsEnum.pdf,
                                    size: ESize.sm,
                                    color: 'text-white',
                                }}
                            />
                        </Div>
                    </Div>

                    {/* CSV Card */}
                    <Div className="flex flex-col justify-between rounded-2xl border-2 border-success-200/80 bg-gradient-to-br from-success-50/60 via-white to-white p-4 shadow-2xs transition-all hover:border-success-400">
                        <Div className="space-y-1.5">
                            <Div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-success-600 text-white shadow-xs">
                                    <Icon name={IconComponentsEnum.layers} size={ESize.xs} color="text-white" />
                                </div>
                                <span className="font-bold text-sm text-gray-900">{t('exportCsv')}</span>
                            </Div>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('exportCsvDesc')}</p>
                        </Div>
                        <Div className="mt-4">
                            <Button
                                id="pos-export-inventory-csv-btn"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={isExportingCsv ? tCommon('loading') : t('downloadCsv')}
                                isLoading={isExportingCsv}
                                disabled={isLoading || products.length === 0}
                                onClick={handleExportCsv}
                                className="w-full justify-center border-success-300 text-success-800 hover:bg-success-50"
                                iconPosition="left"
                                icon={{
                                    name: IconComponentsEnum.filetext,
                                    size: ESize.sm,
                                    color: 'text-success-700',
                                }}
                            />
                        </Div>
                    </Div>
                </Div>

                {/* Close Button */}
                <Div className="flex justify-end pt-2">
                    <Button
                        id="pos-export-modal-close-btn"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('close')}
                        onClick={closeModal}
                    />
                </Div>
            </Div>
        </Modal>
    );
}

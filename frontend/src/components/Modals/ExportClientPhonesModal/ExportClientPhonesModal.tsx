'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Toggle from '@/components/Primitives/Toggle/Toggle';
import { useCurrentModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchAllCreditClientsForExport } from '@/lib/credit-api';
import {
    downloadPhoneNumbersCsv,
    downloadPhoneNumbersXlsx,
    extractPhoneNumbers,
} from '@/lib/export-phone-numbers';
import {
    EButtonSize,
    EButtonType,
    EInputSize,
    ESize,
    EToastType,
    EToggleSize,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

interface ExportClientPhonesModalProps {
    initialSearch?: string;
}

export default function ExportClientPhonesModal({
    initialSearch = '',
}: Readonly<ExportClientPhonesModalProps>) {
    const t = useTranslations('phoneExport');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const { openToast } = useToast();

    const [search, setSearch] = useState<string>(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch.trim());
    const [deduplicate, setDeduplicate] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['export-client-phones-data', debouncedSearch],
        queryFn: () =>
            fetchAllCreditClientsForExport({
                search: debouncedSearch || undefined,
            }),
    });

    const summary = useMemo(() => {
        return extractPhoneNumbers(clients, { deduplicate });
    }, [clients, deduplicate]);

    const handleExportExcel = () => {
        if (summary.validNumbers.length === 0) {
            openToast(tCommon('warning'), t('noNumbers'), { type: EToastType.WARNING });
            return;
        }
        setIsExporting(true);
        try {
            downloadPhoneNumbersXlsx({
                phoneNumbers: summary.validNumbers,
                filenamePrefix: 'clients-telephones',
            });
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
            closeModal();
        } catch {
            openToast(tCommon('error'), t('exportError'), { type: EToastType.ERROR });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportCsv = () => {
        if (summary.validNumbers.length === 0) {
            openToast(tCommon('warning'), t('noNumbers'), { type: EToastType.WARNING });
            return;
        }
        setIsExporting(true);
        try {
            downloadPhoneNumbersCsv({
                phoneNumbers: summary.validNumbers,
                filenamePrefix: 'clients-telephones',
            });
            openToast(tCommon('success'), t('exportSuccess'), { type: EToastType.SUCCESS });
            closeModal();
        } catch {
            openToast(tCommon('error'), t('exportError'), { type: EToastType.ERROR });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            title={t('clientTitle')}
            subTitle={t('clientSubtitle')}
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,560px)]"
        >
            <Div className="space-y-5">
                {/* Filters section */}
                <Div className="rounded-2xl border border-gray-200/80 bg-gray-25/80 p-4 space-y-3.5">
                    <Label variant={EVariantLabel.caption} color="text-gray-500" className="font-semibold uppercase tracking-wider">
                        {tCommon('filter')}
                    </Label>

                    {/* Search Filter Input */}
                    <Div>
                        <Label variant={EVariantLabel.caption} color="text-gray-700" className="mb-1 block font-medium">
                            {t('search')}
                        </Label>
                        <Input
                            id="export-client-search"
                            leftIcon={IconComponentsEnum.search}
                            rightIcon={search ? IconComponentsEnum.close : undefined}
                            onRightIconClick={() => setSearch('')}
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size={EInputSize.medium}
                            containerClassName="w-full bg-white"
                        />
                    </Div>

                    {/* Deduplicate toggle */}
                    <Div className="flex items-center justify-between pt-1">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="cursor-pointer select-none">
                            {t('deduplicate')}
                        </Label>
                        <Toggle
                            id="export-client-dedup"
                            checked={deduplicate}
                            onChange={setDeduplicate}
                            size={EToggleSize.sm}
                        />
                    </Div>
                </Div>

                {/* Summary / Preview Box */}
                <Div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
                    {isLoading ? (
                        <Div className="flex items-center justify-center gap-2 py-3 text-primary-700">
                            <Spinner size={ESize.sm} color="text-primary-600" />
                            <Label variant={EVariantLabel.bodySmall} color="text-primary-700">
                                {t('loading')}
                            </Label>
                        </Div>
                    ) : (
                        <Div className="space-y-1.5">
                            <Div className="flex items-center justify-between">
                                <Label variant={EVariantLabel.body} color="text-gray-900" className="font-semibold">
                                    {t('readyToExport', { count: summary.validCount })}
                                </Label>
                                <span className="inline-flex items-center rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-bold text-white">
                                    {summary.validCount}
                                </span>
                            </Div>

                            <Div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span>{t('scannedCount', { count: summary.totalProcessed })}</span>
                                {(summary.missingCount > 0 || summary.invalidCount > 0) && (
                                    <span className="text-warning-700">
                                        • {t('excludedStats', { missing: summary.missingCount, invalid: summary.invalidCount })}
                                    </span>
                                )}
                                {deduplicate && summary.duplicateCount > 0 && (
                                    <span className="text-gray-500">
                                        • {t('duplicatesCount', { count: summary.duplicateCount })}
                                    </span>
                                )}
                            </Div>
                        </Div>
                    )}
                </Div>

                {/* Actions */}
                <Div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        id="export-client-phones-cancel"
                        type={EButtonType.tertiary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        disabled={isExporting}
                        className="w-full sm:w-auto"
                    />
                    <Div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button
                            id="export-client-phones-csv"
                            type={EButtonType.secondary}
                            size={EButtonSize.medium}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.filetext, size: ESize.sm, color: 'text-primary-500' }}
                            text={t('csvFormat')}
                            onClick={handleExportCsv}
                            disabled={isLoading || isExporting || summary.validCount === 0}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            id="export-client-phones-excel"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            iconPosition="left"
                            icon={{ name: IconComponentsEnum.filetext, size: ESize.sm, color: 'text-white' }}
                            text={t('excelFormat')}
                            onClick={handleExportExcel}
                            disabled={isLoading || isExporting || summary.validCount === 0}
                            className="w-full sm:w-auto"
                        />
                    </Div>
                </Div>
            </Div>
        </Modal>
    );
}

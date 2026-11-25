'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import { EInputSize, EVariantLabel } from '@/Enum/Enum';

export interface ReportPeriodToolbarProps {
    scope: 'month' | 'all';
    year: number;
    month: number;
    yearOptions: { value: string; label: string }[];
    monthOptions: { value: string; label: string }[];
    onScopeChange: (scope: 'month' | 'all') => void;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    rightActions?: ReactNode;
    scopeIdPrefix?: string;
}

export default function ReportPeriodToolbar({
    scope,
    year,
    month,
    yearOptions,
    monthOptions,
    onScopeChange,
    onYearChange,
    onMonthChange,
    rightActions,
    scopeIdPrefix = 'report',
}: Readonly<ReportPeriodToolbarProps>) {
    const tReports = useTranslations('reports');
    const isGlobal = scope === 'all';

    return (
        <Div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Monthly vs Global segmented pill + Year & Month selectors */}
            <Div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Div className="inline-flex h-9 items-center rounded-xl bg-slate-200/70 p-0.5 dark:bg-gray-800">
                    <button
                        type="button"
                        id={`${scopeIdPrefix}-scope-global-btn`}
                        className={`inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition-all sm:text-sm ${
                            isGlobal
                                ? 'bg-white text-primary-950 shadow-xs dark:bg-gray-700 dark:text-white'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => onScopeChange('all')}
                    >
                        {tReports('globalAllTime')}
                    </button>
                    <button
                        type="button"
                        id={`${scopeIdPrefix}-scope-monthly-btn`}
                        className={`inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition-all sm:text-sm ${
                            !isGlobal
                                ? 'bg-white text-primary-950 shadow-xs dark:bg-gray-700 dark:text-white'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => onScopeChange('month')}
                    >
                        {tReports('monthly')}
                    </button>
                </Div>

                {!isGlobal && (
                    <Div className="flex items-center gap-3">
                        <Div className="flex items-center gap-1.5">
                            <Label
                                variant={EVariantLabel.caption}
                                color="text-gray-500"
                                className="text-xs font-medium whitespace-nowrap"
                            >
                                {tReports('year')}
                            </Label>
                            <Div className="w-24 sm:w-28">
                                <Dropdown
                                    size={EInputSize.small}
                                    options={yearOptions}
                                    value={String(year)}
                                    onChange={(val) => {
                                        if (val != null) onYearChange(Number(val));
                                    }}
                                />
                            </Div>
                        </Div>

                        <Div className="flex items-center gap-1.5">
                            <Label
                                variant={EVariantLabel.caption}
                                color="text-gray-500"
                                className="text-xs font-medium whitespace-nowrap"
                            >
                                {tReports('month')}
                            </Label>
                            <Div className="w-32 sm:w-36">
                                <Dropdown
                                    size={EInputSize.small}
                                    options={monthOptions}
                                    value={String(month)}
                                    onChange={(val) => {
                                        if (val != null) onMonthChange(Number(val));
                                    }}
                                />
                            </Div>
                        </Div>
                    </Div>
                )}
            </Div>

            {/* Right: Actions (e.g. Export PDF, New Entry) */}
            {rightActions ? (
                <Div className="flex items-center gap-2">
                    {rightActions}
                </Div>
            ) : null}
        </Div>
    );
}

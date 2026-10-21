'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { monthNames } from '@/lib/date-utils';

export interface MonthYearPickerProps {
    locale: string;
    anchor: Date;
    dialogLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

/**
 * Month/year popover opened from the period label — jump to any date instead of
 * clicking prev/next repeatedly. Keeps the anchor's day-of-month (clamped).
 */
export default function MonthYearPicker({
    locale,
    anchor,
    dialogLabel = 'Choisir une date',
    prevLabel = 'Précédent',
    nextLabel = 'Suivant',
    onSelect,
    onClose,
}: Readonly<MonthYearPickerProps>) {
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [year, setYear] = useState(() => anchor.getFullYear());
    const months = useMemo(() => monthNames(locale), [locale]);

    useEffect(() => {
        popoverRef.current?.focus();
    }, []);

    const selectMonth = (monthIndex: number) => {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const day = Math.min(anchor.getDate(), daysInMonth);
        onSelect(new Date(year, monthIndex, day));
    };

    return (
        <>
            <Div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
            <div
                ref={popoverRef}
                tabIndex={-1}
                role="dialog"
                aria-label={dialogLabel}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        onClose();
                    }
                }}
                className="absolute start-0 top-full z-40 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-3 shadow-lg outline-none"
            >
                <Div className="flex items-center justify-between">
                    <Button
                        id="cal-picker-prev-year"
                        type={EButtonType.tertiary}
                        size={EButtonSize.small}
                        iconPosition="only"
                        icon={{
                            name: IconComponentsEnum.chevronLeft,
                            size: ESize.xs,
                            color: 'text-gray-600',
                        }}
                        aria-label={prevLabel}
                        onClick={() => setYear((y) => y - 1)}
                    />
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-900"
                        className="font-semibold tabular-nums"
                    >
                        {year}
                    </Label>
                    <Button
                        id="cal-picker-next-year"
                        type={EButtonType.tertiary}
                        size={EButtonSize.small}
                        iconPosition="only"
                        icon={{
                            name: IconComponentsEnum.chevronRight,
                            size: ESize.xs,
                            color: 'text-gray-600',
                        }}
                        aria-label={nextLabel}
                        onClick={() => setYear((y) => y + 1)}
                    />
                </Div>
                <Div className="mt-2 grid grid-cols-4 gap-1">
                    {months.map((name, monthIndex) => {
                        const isCurrent =
                            year === anchor.getFullYear() && monthIndex === anchor.getMonth();
                        return (
                            <button
                                key={monthIndex}
                                type="button"
                                onClick={() => selectMonth(monthIndex)}
                                aria-current={isCurrent ? 'date' : undefined}
                                className={`rounded-lg px-1 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                                    isCurrent
                                        ? 'bg-primary-500 font-semibold text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {name}
                            </button>
                        );
                    })}
                </Div>
            </div>
        </>
    );
}

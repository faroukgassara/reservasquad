'use client';

import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { buildCalendarDays, formatDateValue, isSameDay, parseDateValue, WEEKDAY_LABELS } from './datePicker.utils';
import Icon from '../Icon/Icon';
import Label from '../Label/Label';

interface IDatePickerCalendar {
    value?: string;
    min?: string;
    max?: string;
    onChange: (value: string) => void;
    onClose?: () => void;
}

function isDateDisabled(date: Date, min?: string, max?: string): boolean {
    const minDate = parseDateValue(min);
    const maxDate = parseDateValue(max);

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
}

const DatePickerCalendar = ({ value, min, max, onChange, onClose }: IDatePickerCalendar) => {
    const selectedDate = parseDateValue(value);
    const today = useMemo(() => new Date(), []);
    const [viewDate, setViewDate] = useState(() => selectedDate ?? today);

    useEffect(() => {
        const parsed = parseDateValue(value);
        if (parsed) setViewDate(parsed);
    }, [value]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const monthLabel = new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
    }).format(viewDate);

    const days = buildCalendarDays(viewDate);

    const handleSelect = (date: Date) => {
        if (isDateDisabled(date, min, max)) return;
        onChange(formatDateValue(date));
        onClose?.();
    };

    return (
        <div className="w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <Icon
                    name={IconComponentsEnum.chevronLeft}
                    size={ESize.sm}
                    color="text-gray-600"
                    className="cursor-pointer rounded-md p-1 hover:bg-gray-100"
                    handleClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                />
                <Label
                    variant={EVariantLabel.bodySmall}
                    color="text-gray-900"
                    className="font-semibold capitalize"
                >
                    {monthLabel}
                </Label>
                <Icon
                    name={IconComponentsEnum.chevronRight}
                    size={ESize.sm}
                    color="text-gray-600"
                    className="cursor-pointer rounded-md p-1 hover:bg-gray-100"
                    handleClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                />
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((weekday) => (
                    <Label
                        key={weekday}
                        variant={EVariantLabel.hint}
                        color="text-gray-500"
                        className="text-center font-medium"
                    >
                        {weekday}
                    </Label>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map(({ date, inCurrentMonth }) => {
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isToday = isSameDay(date, today);
                    const disabled = isDateDisabled(date, min, max);

                    return (
                        <button
                            key={formatDateValue(date)}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelect(date)}
                            className={twMerge(
                                'flex size-9 items-center justify-center rounded-lg text-sm transition-colors',
                                inCurrentMonth ? 'text-gray-900' : 'text-gray-300',
                                !disabled && !isSelected && 'hover:bg-primary-50',
                                isToday && !isSelected && 'ring-1 ring-primary-300',
                                isSelected && 'bg-primary-500 text-white hover:bg-primary-600',
                                disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                            )}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <button
                    type="button"
                    onClick={() => handleSelect(today)}
                    className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                >
                    Aujourd&apos;hui
                </button>
                {selectedDate && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            onClose?.();
                        }}
                        className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                    >
                        Effacer
                    </button>
                )}
            </div>
        </div>
    );
};

export default DatePickerCalendar;

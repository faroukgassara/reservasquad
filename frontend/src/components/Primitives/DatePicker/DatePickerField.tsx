'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';
import { EInputSize, EInputStatus, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { INPUT_SIZES, INPUT_STATUS_FIELD, INPUT_STATUS_ICON_COLOR } from '@/common/Data/Data';
import { formatDateDisplay, hasDateValue, resolveInputStatus } from './datePicker.utils';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import DatePickerCalendar from './DatePickerCalendar';
import { useFloatingPopover } from './useFloatingPopover';

export interface IDatePickerFieldProps {
    id: string;
    label?: string;
    required?: boolean;
    prefix?: string;
    value?: string;
    min?: string;
    max?: string;
    disabled?: boolean;
    error?: boolean;
    status?: EInputStatus;
    size?: EInputSize;
    className?: string;
    containerClassName?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
}

function getDateFieldWrapperClassName({
    status,
    size,
    disabled,
    hasValue,
    isOpen,
    className,
}: {
    status: EInputStatus;
    size: EInputSize;
    disabled?: boolean;
    hasValue: boolean;
    isOpen: boolean;
    className?: string;
}): string {
    const sizeConfig = INPUT_SIZES[size];

    return twMerge(
        'relative flex w-full min-w-0 items-center rounded-lg border bg-white text-left transition-colors duration-200',
        sizeConfig.field,
        INPUT_STATUS_FIELD[status],
        status === EInputStatus.default && hasValue && !disabled && 'border-gray-300 bg-gray-50',
        disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 hover:border-gray-200',
        !disabled && 'cursor-pointer',
        isOpen && 'border-2',
        className,
    );
}

const DatePickerField = ({
    id,
    label,
    required,
    prefix,
    value,
    min,
    max,
    disabled,
    error,
    status,
    size = EInputSize.medium,
    className,
    containerClassName,
    placeholder = 'jj/mm/aaaa',
    onChange,
}: IDatePickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { mounted, triggerRef, popoverRef, popoverStyle } = useFloatingPopover(isOpen);
    const resolvedStatus = resolveInputStatus(error, status);
    const sizeConfig = INPUT_SIZES[size];
    const iconColor = INPUT_STATUS_ICON_COLOR[resolvedStatus];
    const filled = hasDateValue(value);
    const displayValue = formatDateDisplay(value);
    const calendarId = useId();

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Node;
        if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
            return;
        }
        setIsOpen(false);
    }, [popoverRef]);

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, handleClickOutside]);

    const handleChange = (nextValue: string) => {
        onChange?.(nextValue);
        setIsOpen(false);
    };

    const calendarPopover =
        isOpen && !disabled && mounted
            ? createPortal(
                  <div
                      ref={popoverRef}
                      id={calendarId}
                      role="dialog"
                      aria-label="Calendrier"
                      style={popoverStyle}
                      className="w-max max-w-[calc(100vw-1rem)]"
                  >
                      <DatePickerCalendar
                          value={value}
                          min={min}
                          max={max}
                          onChange={handleChange}
                          onClose={() => setIsOpen(false)}
                      />
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div
            ref={containerRef}
            className={twMerge('relative flex w-full min-w-0 flex-col', containerClassName)}
        >
            {label ? (
                <Label htmlFor={id} className="mb-1.5" variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {label}
                    {required ? (
                        <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>
                            *
                        </Label>
                    ) : null}
                </Label>
            ) : null}

            <div className="relative w-full min-w-0">
                <button
                    ref={triggerRef}
                    id={id}
                    type="button"
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="dialog"
                    aria-controls={calendarId}
                    onClick={() => !disabled && setIsOpen((open) => !open)}
                    className={getDateFieldWrapperClassName({
                        status: resolvedStatus,
                        size,
                        disabled,
                        hasValue: filled,
                        isOpen,
                        className,
                    })}
                >
                    {prefix ? (
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color={filled ? 'text-gray-900' : 'text-gray-500'}
                            className={twMerge(
                                'pointer-events-none shrink-0 whitespace-nowrap',
                                size === EInputSize.large ? 'pl-4' : 'pl-3',
                            )}
                        >
                            {prefix} :
                        </Label>
                    ) : null}
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color={filled ? 'text-gray-900' : 'text-gray-400'}
                        className={twMerge(
                            'min-w-0 flex-1 truncate text-left leading-none',
                            !prefix && (size === EInputSize.large ? 'pl-4' : 'pl-3'),
                            size === EInputSize.large ? 'pr-11' : 'pr-10',
                            sizeConfig.text,
                        )}
                    >
                        {displayValue || placeholder}
                    </Label>
                    <Icon
                        name={IconComponentsEnum.calendar}
                        color={iconColor}
                        className={twMerge('pointer-events-none absolute top-1/2 -translate-y-1/2', sizeConfig.iconRight)}
                        size={sizeConfig.iconSize}
                    />
                </button>
            </div>

            {calendarPopover}
        </div>
    );
};

export default DatePickerField;

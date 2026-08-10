import React, { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { EBadgeSize, EBadgeType, EInputSize, EInputStatus, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import Label from '../Label/Label';
import IDropdown, { IDropdownOption } from '@/interfaces/IPrimitives/IDropdown/IDropdown';
import Badge from '@/components/Primitives/Badge/Badge';
import Icon from '../Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import { INPUT_SIZES, INPUT_STATUS_FIELD, INPUT_STATUS_ICON_COLOR, INPUT_STATUS_HINT_COLOR } from '@/common/Data/Data';

function resolveInputStatus(error?: boolean, status?: EInputStatus): EInputStatus {
    if (error) return EInputStatus.error;
    return status ?? EInputStatus.default;
}

function getTriggerHorizontalPadding(
    size: EInputSize,
    hasLeftIcon: boolean,
): string {
    if (hasLeftIcon) {
        return size === EInputSize.large ? 'pl-11 pr-11' : 'pl-10 pr-10';
    }
    return size === EInputSize.large ? 'pl-4 pr-11' : 'pl-3 pr-10';
}

function getMultiTriggerHeightClass(size: EInputSize): string {
    if (size === EInputSize.large) return 'h-auto min-h-12 py-1';
    if (size === EInputSize.small) return 'h-auto min-h-8 py-1';
    return 'h-auto min-h-10 py-1';
}

function getTriggerWrapperClassName({
    status,
    size,
    disabled,
    hasValue,
    isOpen,
    isMultiple,
    hasSelectedBadges,
    className,
}: {
    status: EInputStatus;
    size: EInputSize;
    disabled?: boolean;
    hasValue: boolean;
    isOpen: boolean;
    isMultiple: boolean;
    hasSelectedBadges: boolean;
    className?: string;
}): string {
    const sizeConfig = INPUT_SIZES[size];

    return twMerge(
        'relative flex w-full items-center rounded-lg border bg-white text-left transition-colors duration-200',
        isMultiple && hasSelectedBadges ? getMultiTriggerHeightClass(size) : sizeConfig.field,
        INPUT_STATUS_FIELD[status],
        status === EInputStatus.default && hasValue && !disabled && 'border-gray-300 bg-gray-50',
        disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 hover:border-gray-200',
        !disabled && 'cursor-pointer',
        isOpen && 'border-2',
        className,
    );
}

interface DropdownContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    selectedValue: string | number | undefined;
    handleSelect: (value: string | number) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
    onClose?: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const useDropdown = () => {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('useDropdown must be used within a DropdownProvider');
    }
    return context;
};

export const DropdownRoot = ({
    children,
    value,
    onChange,
    className,
    keepOpen = false,
    onClose,
}: {
    children: React.ReactNode;
    value?: string | number;
    onChange?: (value: string | number) => void;
    className?: string;
    keepOpen?: boolean;
    onClose?: () => void;
}) => {
    const [isOpenState, setIsOpenState] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const setIsOpen = useCallback((open: boolean) => {
        setIsOpenState(open);
        if (!open) onClose?.();
    }, [onClose]);

    const handleSelect = useCallback((selected: string | number) => {
        onChange?.(selected);
        if (!keepOpen) setIsOpen(false);
    }, [keepOpen, onChange, setIsOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inContainer = containerRef.current?.contains(target);
            const inContent = contentRef.current?.contains(target);
            if (!inContainer && !inContent) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsOpen]);

    const contextValue = useMemo(
        () => ({ isOpen: isOpenState, setIsOpen, selectedValue: value, handleSelect, containerRef, contentRef, onClose }),
        [isOpenState, setIsOpen, value, handleSelect, onClose],
    );

    return (
        <DropdownContext.Provider value={contextValue}>
            <div ref={containerRef} className={twMerge('relative inline-block w-auto', className)}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

export const DropdownTrigger = ({ children, className, disabled }: { children: React.ReactNode; className?: string; disabled?: boolean }) => {
    const { isOpen, setIsOpen } = useDropdown();
    return (
        <button
            type="button"
            disabled={disabled}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            className={twMerge('inline-flex w-full border-0 bg-transparent p-0 text-left', className)}
        >
            {children}
        </button>
    );
};

export const DropdownContent = ({
    children,
    className,
    matchTriggerWidth = false,
}: {
    children: React.ReactNode;
    className?: string;
    matchTriggerWidth?: boolean;
}) => {
    const { isOpen, contentRef } = useDropdown();

    if (!isOpen) return null;

    return (
        <div
            ref={contentRef}
            className={twMerge(
                'absolute left-0 top-full z-dropdown mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
                matchTriggerWidth ? 'w-full' : 'min-w-40',
                className,
            )}
        >
            {children}
        </div>
    );
};

const DropdownFieldLabel = ({
    label,
    required,
    fieldId,
}: {
    label: string;
    required?: boolean;
    fieldId: string;
}) => (
    <Label htmlFor={fieldId} className="mb-1.5" variant={EVariantLabel.bodySmall} color="text-gray-900">
        {label}
        {required && (
            <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>
                *
            </Label>
        )}
    </Label>
);

const DropdownHint = ({ hintText, error, status }: { hintText: string; error?: boolean; status?: EInputStatus }) => {
    const resolvedStatus = resolveInputStatus(error, status);
    const hintColor = INPUT_STATUS_HINT_COLOR[resolvedStatus];

    return (
        <div className="mt-1.5 flex items-center gap-1.5">
            <Icon
                color={hintColor}
                name={IconComponentsEnum.info}
                size={ESize.xs}
            />
            <Label variant={EVariantLabel.hint} color={hintColor}>
                {hintText}
            </Label>
        </div>
    );
};

interface IDropdownTriggerButton {
    id: string;
    placeholder?: string;
    displayLabel?: string;
    selectedOptions?: IDropdownOption[];
    onRemoveOption?: (value: string | number) => void;
    isMultiple?: boolean;
    error?: boolean;
    status?: EInputStatus;
    size?: EInputSize;
    disabled?: boolean;
    className?: string;
    leftIcon?: keyof typeof IconComponentsEnum;
}

const DropdownSelectedBadges = ({
    id,
    selectedOptions,
    onRemoveOption,
}: {
    id: string;
    selectedOptions: IDropdownOption[];
    onRemoveOption?: (value: string | number) => void;
}) => (
    <>
        {selectedOptions.map((option) => (
            <span
                key={option.value}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                role="none"
            >
                <Badge
                    id={`${id}-badge-${option.value}`}
                    text={option.label}
                    type={EBadgeType.revprimary}
                    size={EBadgeSize.tiny}
                    isDismissible
                    onDismiss={() => onRemoveOption?.(option.value)}
                    onClick={(event: React.MouseEvent) => event.stopPropagation()}
                />
            </span>
        ))}
    </>
);

const DropdownTriggerContent = ({
    id,
    placeholder,
    displayLabel,
    selectedOptions,
    onRemoveOption,
    isMultiple,
    size,
    hasLeftIcon = false,
}: {
    id: string;
    placeholder?: string;
    displayLabel?: string;
    selectedOptions: IDropdownOption[];
    onRemoveOption?: (value: string | number) => void;
    isMultiple: boolean;
    size: EInputSize;
    hasLeftIcon?: boolean;
}) => {
    const sizeConfig = INPUT_SIZES[size];
    const hasSelectedBadges = isMultiple && selectedOptions.length > 0;
    const hasValue = isMultiple ? hasSelectedBadges : Boolean(displayLabel);

    if (isMultiple) {
        return (
            <div
                className={twMerge(
                    'flex min-w-0 flex-1 items-center',
                    getTriggerHorizontalPadding(size, hasLeftIcon),
                    hasSelectedBadges && 'flex-wrap gap-1',
                )}
            >
                {hasSelectedBadges ? (
                    <DropdownSelectedBadges
                        id={id}
                        selectedOptions={selectedOptions}
                        onRemoveOption={onRemoveOption}
                    />
                ) : (
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-400" className="truncate">
                        {placeholder || 'Select an option'}
                    </Label>
                )}
            </div>
        );
    }

    return (
        <div
            className={twMerge(
                'flex h-full min-w-0 flex-1 items-center',
                getTriggerHorizontalPadding(size, hasLeftIcon),
                sizeConfig.text,
            )}
        >
            <Label
                variant={EVariantLabel.bodySmall}
                color={hasValue ? 'text-gray-900' : 'text-gray-400'}
                className="truncate leading-none"
            >
                {displayLabel || placeholder || 'Select an option'}
            </Label>
        </div>
    );
};

const DropdownTriggerButton = forwardRef<HTMLButtonElement, IDropdownTriggerButton>(
    ({
        id,
        error,
        status,
        size = EInputSize.medium,
        className,
        disabled,
        placeholder,
        displayLabel,
        selectedOptions = [],
        onRemoveOption,
        isMultiple = false,
        leftIcon,
    }, ref) => {
        const { isOpen, setIsOpen } = useDropdown();
        const resolvedStatus = resolveInputStatus(error, status);
        const sizeConfig = INPUT_SIZES[size];
        const iconColor = INPUT_STATUS_ICON_COLOR[resolvedStatus];
        const hasSelectedBadges = isMultiple && selectedOptions.length > 0;
        const hasValue = isMultiple ? hasSelectedBadges : Boolean(displayLabel);
        const hasLeftIcon = Boolean(leftIcon);

        return (
            <button
                type="button"
                id={id}
                ref={ref}
                disabled={disabled}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className={getTriggerWrapperClassName({
                    status: resolvedStatus,
                    size,
                    disabled,
                    hasValue,
                    isOpen,
                    isMultiple,
                    hasSelectedBadges,
                    className,
                })}
            >
                {leftIcon && (
                    <Icon
                        color={iconColor}
                        className={twMerge('pointer-events-none absolute top-1/2 -translate-y-1/2', sizeConfig.iconLeft)}
                        name={leftIcon}
                        size={sizeConfig.iconSize}
                    />
                )}
                <DropdownTriggerContent
                    id={id}
                    placeholder={placeholder}
                    displayLabel={displayLabel}
                    selectedOptions={selectedOptions}
                    onRemoveOption={onRemoveOption}
                    isMultiple={isMultiple}
                    size={size}
                    hasLeftIcon={hasLeftIcon}
                />
                <Icon
                    name={isOpen ? IconComponentsEnum.chevronUp : IconComponentsEnum.chevronDown}
                    color={iconColor}
                    className={twMerge('pointer-events-none absolute top-1/2 -translate-y-1/2', sizeConfig.iconRight)}
                    size={sizeConfig.iconSize}
                />
            </button>
        );
    },
);

DropdownTriggerButton.displayName = 'DropdownTriggerButton';

const DropdownOptionItem = ({
    option,
    isSelected,
    onSelect,
}: {
    option: IDropdownOption;
    isSelected: boolean;
    onSelect: () => void;
}) => (
    <button
        type="button"
        onClick={onSelect}
        className={twMerge(
            'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-900',
            'cursor-pointer transition-colors hover:bg-primary-50',
            isSelected && 'bg-gray-50',
        )}
    >
        <span className="flex min-w-0 items-center gap-2">
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
        </span>
        {isSelected && (
            <Icon name={IconComponentsEnum.check} size="text-large" color="text-primary-600" className="shrink-0" />
        )}
    </button>
);

const DropdownOptionsList = ({
    options: visibleOptions,
    isMultiple,
    selectedValues,
    onMultipleSelect,
}: {
    options: IDropdownOption[];
    isMultiple: boolean;
    selectedValues: (string | number)[];
    onMultipleSelect: (value: string | number) => void;
}) => {
    const { handleSelect } = useDropdown();

    return (
        <>
            {visibleOptions.map((option) => {
                const isSelected = isMultiple && selectedValues.includes(option.value);
                return (
                    <DropdownOptionItem
                        key={option.value}
                        option={option}
                        isSelected={!!isSelected}
                        onSelect={() => {
                            if (isMultiple) onMultipleSelect(option.value);
                            else handleSelect(option.value);
                        }}
                    />
                );
            })}
        </>
    );
};

function isMultipleValue(value: IDropdown['value']): value is (string | number)[] {
    return Array.isArray(value);
}

function toSelectedValues(value: IDropdown['value']): (string | number)[] {
    if (Array.isArray(value)) return value;
    if (value !== undefined) return [value];
    return [];
}

function getSingleTriggerLabel(
    selectedValues: (string | number)[],
    options: IDropdownOption[],
): string | undefined {
    const selected = options.find((option) => option.value === selectedValues[0]);
    return selected?.label;
}

function getEmptyMessage(
    search: string,
    hideSelected: boolean,
    selectedCount: number,
    totalOptions: number,
): string {
    if (search) return 'No results';
    if (hideSelected && selectedCount === totalOptions) return 'All selected';
    return 'No options';
}

const Dropdown = ({
    label,
    required,
    error,
    status,
    size = EInputSize.medium,
    hintText,
    disabled,
    className,
    placeholder = 'Select...',
    containerClassName,
    leftIcon,
    options,
    value,
    onChange,
    searchable = false,
}: IDropdown) => {
    const fieldId = useId();
    const searchId = `${fieldId}-search`;
    const [search, setSearch] = useState('');

    const isMultiple = isMultipleValue(value);
    const selectedValues = useMemo(() => toSelectedValues(value), [value]);

    const selectedOption = !isMultiple
        ? options.find((option) => option.value === value)
        : undefined;

    const selectedOptions = useMemo(
        () => options.filter((option) => selectedValues.includes(option.value)),
        [options, selectedValues],
    );

    const hideSelected = searchable && isMultiple;

    const visibleOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return options.filter((option) => {
            if (hideSelected && selectedValues.includes(option.value)) return false;
            if (!query) return true;
            return option.label.toLowerCase().includes(query);
        });
    }, [options, search, selectedValues, hideSelected]);

    const handleClose = useCallback(() => setSearch(''), []);

    const handleSingleSelect = useCallback((val: string | number) => {
        onChange?.(val);
    }, [onChange]);

    const handleMultipleSelect = useCallback((val: string | number) => {
        const current = toSelectedValues(value);
        const isAdditive = searchable && hideSelected;

        let next: (string | number)[];
        if (isAdditive) {
            next = current.includes(val) ? current : [...current, val];
        } else if (current.includes(val)) {
            next = current.filter((item) => item !== val);
        } else {
            next = [...current, val];
        }

        onChange?.(next);

        if (isAdditive) setSearch('');
    }, [onChange, searchable, hideSelected, value]);

    const handleRemoveOption = useCallback((val: string | number) => {
        const current = toSelectedValues(value);
        onChange?.(current.filter((item) => item !== val));
    }, [onChange, value]);

    const displayLabel = !isMultiple
        ? getSingleTriggerLabel(selectedValues, options) ?? selectedOption?.label
        : undefined;

    const emptyMessage = getEmptyMessage(
        search,
        hideSelected,
        selectedValues.length,
        options.length,
    );

    return (
        <DropdownRoot
            value={!isMultiple ? (value as string | number | undefined) : undefined}
            onChange={!isMultiple ? handleSingleSelect : undefined}
            keepOpen={isMultiple}
            onClose={handleClose}
            className={twMerge('relative flex w-full flex-col', containerClassName)}
        >
            {label && <DropdownFieldLabel label={label} required={required} fieldId={fieldId} />}

            <div className="relative w-full">
                <DropdownTriggerButton
                    id={fieldId}
                    className={className}
                    error={error}
                    status={status}
                    size={size}
                    disabled={disabled}
                    placeholder={placeholder}
                    displayLabel={displayLabel}
                    isMultiple={isMultiple}
                    selectedOptions={selectedOptions}
                    onRemoveOption={handleRemoveOption}
                    leftIcon={leftIcon}
                />

                <DropdownContent matchTriggerWidth className="flex flex-col">
                    {searchable && (
                        <div className="border-b border-gray-100 p-2">
                            <Input
                                id={searchId}
                                type={EInputType.text}
                                size={size}
                                placeholder="Search..."
                                value={search}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                            />
                        </div>
                    )}

                    <div className="max-h-48 overflow-y-auto py-1">
                        {visibleOptions.length > 0 ? (
                            <DropdownOptionsList
                                options={visibleOptions}
                                isMultiple={isMultiple}
                                selectedValues={selectedValues}
                                onMultipleSelect={handleMultipleSelect}
                            />
                        ) : (
                            <div className="px-3 py-3 text-sm text-gray-400">{emptyMessage}</div>
                        )}
                    </div>
                </DropdownContent>
            </div>

            {hintText && <DropdownHint hintText={hintText} error={error} status={status} />}
        </DropdownRoot>
    );
};

export default Dropdown;

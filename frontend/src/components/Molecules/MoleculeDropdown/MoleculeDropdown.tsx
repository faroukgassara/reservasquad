import { DropdownContent, DropdownItem, DropdownRoot, DropdownTrigger } from "@/components/Atoms/AtomDropdown/AtomDropdownLogic";
import AtomDropdownTrigger from "@/components/Atoms/AtomDropdown/AtomDropdownTrigger";
import { EVariantLabel, IconComponentsEnum } from "@/Enum/Enum";
import { twMerge } from "tailwind-merge";
import { IMoleculeDropdownMulti } from "@/interfaces/Molecules/IMoleculeDropdown/IMoleculeDropdown";
import { Icon, Label } from "@/components/Atoms";

const MoleculeDropdown = ({
    label,
    required,
    error,
    hintText,
    disabled,
    className,
    placeholder,
    containerClassName,
    options,
    value,
    onChange,
    multiSelect = false,
}: IMoleculeDropdownMulti) => {

    const selectedValues: (string | number)[] = multiSelect
        ? Array.isArray(value) ? value : (value !== undefined ? [value] : [])
        : [];

    const selectedOption = !multiSelect
        ? options.find(option => option.value === value)
        : undefined;

    const multiLabel = multiSelect && Array.isArray(value) && value.length > 0
        ? options
            .filter(o => (value as (string | number)[]).includes(o.value as string))
            .map(o => o.label)
            .join(', ')
        : undefined;

    const handleMultiSelect = (val: string | number) => {
        if (!multiSelect) return;
        const current = Array.isArray(value) ? (value as (string | number)[]) : [];
        const next = current.includes(val)
            ? current.filter(v => v !== val)
            : [...current, val];
        (onChange as (v: string | number | string[]) => void)?.(next as string[]);
    };

    const handleSingleSelect = (val: string | number) => {
        (onChange as (v: string | number) => void)?.(val);
    };

    return (
        <DropdownRoot
            value={!multiSelect ? (value as string | number | undefined) : undefined}
            onChange={!multiSelect ? handleSingleSelect : undefined}
            className={twMerge('relative flex flex-col', containerClassName)}
        >

            {label && (
                <Label className="mb-1" variant={EVariantLabel.bodySmall} color="text-gray-900">
                    {label}
                    {required && (
                        <Label
                            className="ml-1 text-primary-10 align-middle"
                            variant={EVariantLabel.bodySmall}
                            color="text-primary-600"
                        >
                            *
                        </Label>
                    )}
                </Label>
            )}
            <div className="relative">
                <DropdownTrigger className={twMerge("w-full", disabled ? 'pointer-events-none' : '')}>
                    <AtomDropdownTrigger
                        className={className}
                        error={error}
                        disabled={disabled}
                        placeholder={placeholder}
                        label={multiSelect ? multiLabel : selectedOption?.label}
                        icon={!multiSelect ? selectedOption?.icon : undefined}
                    />
                </DropdownTrigger>
                <DropdownContent>
                    {options?.length > 0 ? (
                        options.map((opt) => {
                            const isChecked = multiSelect && selectedValues.includes(opt.value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={multiSelect ? () => handleMultiSelect(opt.value) : undefined}
                                    className={twMerge(
                                        "px-2.5 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between",
                                        isChecked ? "bg-gray-50" : ""
                                    )}
                                >
                                    {multiSelect ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                {opt.icon && <span>{opt.icon}</span>}
                                                <span>{opt.label}</span>
                                            </div>
                                            {isChecked && (
                                                <Icon
                                                    name={IconComponentsEnum.check}
                                                    size="text-large"
                                                    color="text-gray-700"
                                                />
                                            )}
                                        </>
                                    ) : (
                                        // Fall through to DropdownItem for single-select
                                        <DropdownItem value={opt.value}>
                                            <div className="flex items-center">
                                                {opt.icon && <span className="mr-2">{opt.icon}</span>}
                                                <span>{opt.label}</span>
                                            </div>
                                        </DropdownItem>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-3 text-gray-300 text-sm">No options</div>
                    )}
                </DropdownContent>
            </div>
            {hintText && (
                <div className="flex items-center mt-1 gap-1">
                    <Icon color={error ? 'text-error' : 'text-gray-700'} name={IconComponentsEnum.info} size="text-large" />
                    <Label color={error ? 'text-danger-700' : 'text-gray-700'} className={`mt-1`} variant={EVariantLabel.hint}>
                        {hintText}
                    </Label>
                </div>
            )}
        </DropdownRoot>
    );
};

export default MoleculeDropdown;
export default interface IMoleculeDropdown<V extends string | number | string[] = string | number> {
    label?: string;
    required?: boolean;
    error?: boolean;
    hintText?: string;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    containerClassName?: string;
    options: Array<{
        label: string;
        value: string | number;
        icon?: React.ReactNode;
    }>
    value?: V;
    onChange?: (value: V) => void;
}

export interface IMoleculeDropdownMulti extends IMoleculeDropdown<string | number | string[]> {
    multiSelect?: boolean;
}
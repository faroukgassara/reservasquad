import { EInputSize, EInputStatus, IconComponentsEnum } from '@/Enum/Enum';

export interface IDropdownOption {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

export default interface IDropdown {
    label?: string;
    required?: boolean;
    error?: boolean;
    status?: EInputStatus;
    size?: EInputSize;
    hintText?: string;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    containerClassName?: string;
    leftIcon?: keyof typeof IconComponentsEnum;
    optionIcon?: React.ReactNode;
    options: IDropdownOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    searchable?: boolean;
}

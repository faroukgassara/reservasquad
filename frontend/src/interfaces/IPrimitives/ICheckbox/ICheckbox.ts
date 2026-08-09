interface ICheckbox extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    id: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type { ICheckbox };
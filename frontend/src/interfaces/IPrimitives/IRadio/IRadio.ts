interface IRadio extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'name'> {
    label?: string;
    value: string;
    id: string;
    disabled?: boolean;
}

export type { IRadio };
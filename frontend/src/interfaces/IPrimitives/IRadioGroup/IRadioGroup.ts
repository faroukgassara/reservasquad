interface IRadioGroup {
    name: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
}

interface IRadioGroupContext {
    name: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export type { IRadioGroup, IRadioGroupContext };
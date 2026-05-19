import { ESize } from "@/Enum/Enum";

interface ITabOption {
    label: string;
    value: string;
}

export type MoleculeTabVariant = 'pill' | 'underline';

export interface IMoleculeTabProps {
    options: ITabOption[];
    value: string;
    onChange: (value: string) => void;
    size?: ESize;
    variant?: MoleculeTabVariant;
    buttonClassName?: string;
    className?: string;
}

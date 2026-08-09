import { EInputSize, EInputStatus, EInputType, IconComponentsEnum } from '@/Enum/Enum'

export type IInput = {
    isPassword?: boolean
    label?: string
    hintText?: string
    containerClassName?: string
    id: string,
    isTextArea?: boolean
    rows?: number
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onRightIconClick?: () => void;
    leftIcon?: keyof typeof IconComponentsEnum
    rightIcon?: keyof typeof IconComponentsEnum
    error?: boolean
    status?: EInputStatus
    size?: EInputSize
    disabled?: boolean
    readOnly?: boolean
    className?: string
    type?: EInputType
    required?: boolean;
    placeholder?: string;
    value?: string | readonly string[] | number;
    accept?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

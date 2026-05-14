import { EButtonSize, EButtonType } from "@/Enum/Enum"

export interface IAtomButton {
    className?: string,
    style?: object
    onClick?: any,
    children?: React.ReactNode | React.ReactNode[] | string
    type?: EButtonType
    disabled?: boolean
    size?: EButtonSize,
    isCircular?: boolean
    id: string
    text?: string;
    ariaBusy?: boolean;
}

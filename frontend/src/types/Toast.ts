import { IconComponentsEnum, EToastType } from '@/Enum/Enum'
import { ReactNode } from 'react'
import { ToastPosition } from 'react-toastify'

type TToastOptions = {
    type?: EToastType
    position?: ToastPosition
    duration?: number
    withoutCloseButton?: boolean
    icon?: keyof typeof IconComponentsEnum
    iconColor?: string
    iconSize?: string
    onClickToast?: () => void
}

type TToastContextProps = {
    openToast: (
        title: ReactNode,
        message: ReactNode,
        options?: TToastOptions,
        toastId?: string
    ) => void
    closeToast: (id?: string) => void
}

export type { TToastOptions, TToastContextProps }

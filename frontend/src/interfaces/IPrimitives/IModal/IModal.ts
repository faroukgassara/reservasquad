import { ReactNode } from 'react'

interface IModal {
    canClose?: boolean
    canCloseOnClickOutisde?: boolean
    className?: string
    bodyClassName?: string
    title?: string | ReactNode
    isDrawer?: boolean
    subTitle?: string | ReactNode
}

export type { IModal }

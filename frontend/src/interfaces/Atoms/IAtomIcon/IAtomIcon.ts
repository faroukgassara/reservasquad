import { IconComponentsEnum, ESize } from "@/Enum/Enum"
import { ELabelColor } from "@/theme/labelColors"
import { CSSProperties } from "react"

interface IAtomIcon {
    name: keyof typeof IconComponentsEnum
    size: ESize | string
    color: ELabelColor
    className?: string
    handleClick?: () => void
    style?: CSSProperties
}

export type { IAtomIcon } 
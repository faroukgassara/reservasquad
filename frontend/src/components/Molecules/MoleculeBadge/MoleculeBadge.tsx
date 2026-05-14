import { AtomBadge } from "@/components/Atoms"
import AtomButton from "@/components/Atoms/AtomButton/AtomButton"
import { useState } from "react"

const MoleculeBadge = ({
    text,
    onDismiss,
    isDismissible = false,
    rightSlot,
    leftSlot,
    ...badgeProps
}: {
    text: string
    onDismiss?: () => void
    isDismissible?: boolean
    leftSlot?: React.ReactNode
    rightSlot?: React.ReactNode
} & React.ComponentProps<typeof AtomBadge>) => {
    const [visible, setVisible] = useState(true)

    if (!visible) return null


    return (
        <AtomBadge
            text={text}
            {...badgeProps}
            leftSlot={leftSlot}
            rightSlot={
                isDismissible && !rightSlot ? (
                    <AtomButton
                    id={`badge-${text}`}
                        onClick={() => {
                            setVisible(false)
                            onDismiss?.()
                        }}
                        className="ml-1 hover:opacity-70"
                        aria-label="Dismiss badge"
                    >
                        X
                    </AtomButton>
                ) : rightSlot
            }
        />
    )
}

export default MoleculeBadge
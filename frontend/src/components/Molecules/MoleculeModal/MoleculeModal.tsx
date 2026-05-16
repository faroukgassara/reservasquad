import { forwardRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCurrentModal } from '@/contexts/ModalContext'
import WithChildren from '@/types/WithChildren'
import { twMerge } from 'tailwind-merge'
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel'
import MoleculeButton from '@/components/Molecules/MoleculeButton/MoleculeButton'
import { IMoleculeModal } from '@/interfaces/Molecules/IMoleculeModal/IMoleculeModal'

const MoleculeModal = forwardRef<HTMLDivElement, WithChildren<IMoleculeModal>>(
  (
    {
      children,
      canClose,
      canCloseOnClickOutisde,
      bodyClassName,
      title,
      isDrawer,
      className,
      subTitle
    },
    ref
  ) => {
    const { closeModal, setCanClose, setCanCloseOnClickOutside, setIsDrawer } = useCurrentModal()

    useEffect(() => {
      setCanClose?.(!!canClose)
      setCanCloseOnClickOutside?.(!!canCloseOnClickOutisde)
      setIsDrawer?.(!!isDrawer)
      return () => {
        setCanClose?.(false)
        setCanCloseOnClickOutside?.(false)
        setIsDrawer?.(false)
      }
    }, [
      setCanClose,
      setCanCloseOnClickOutside,
      canCloseOnClickOutisde,
      canClose,
      setIsDrawer,
      isDrawer,
    ])

    return (
      <motion.div
        className={twMerge(
          "fixed inset-0 z-9999 flex items-center justify-center bg-black/40",
          isDrawer && "items-stretch justify-end"
        )}
        onClick={canCloseOnClickOutisde ? closeModal : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={twMerge(
            `w-full h-full sm:w-full sm:h-full md:w-1/3 md:h-auto flex flex-col bg-white shadow-md
            ${isDrawer
              ? "h-screen w-full sm:w-full md:w-[420px] rounded-none"
              : "w-[min(92vw,520px)] h-auto max-h-[90vh] rounded-lg"
            } ${className}`
          )}
          ref={ref}
          initial={isDrawer ? { x: 1000 } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={isDrawer ? { x: 1000 } : { opacity: 0, y: -20 }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          data-modal="true"
        >
          {canClose && (
            <div className="flex justify-between items-center rounded-t-lg py-1 pl-0 pr-5 text-color-background bg-color-primary z-modal">
              {isDrawer ? (
                <MoleculeButton
                  id="button-close"
                  type={EButtonType.iconButton}
                  size={EButtonSize.small}
                  icon={{
                    name: IconComponentsEnum.arrowLeft,
                    size: ESize.md,
                    color: 'text-white',
                  }}
                  iconPosition="only"
                  onClick={closeModal}
                  className="mr-3"
                />
              ) : (
                <div className="w-8 mr-3" />
              )}
              <div className="flex flex-col flex-1">
                <AtomLabel color="text-gray-900" variant={EVariantLabel.h5}>{title}</AtomLabel>
                <AtomLabel color="text-gray-900" variant={EVariantLabel.bodySmall}>{subTitle}</AtomLabel>
              </div>
            </div>
          )}
          <div className={twMerge("flex-1 overflow-auto", bodyClassName)}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    )
  }
)

MoleculeModal.displayName = 'Modal'

export default MoleculeModal
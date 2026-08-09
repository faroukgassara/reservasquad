import { forwardRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCurrentModal } from '@/contexts/ModalContext'
import WithChildren from '@/types/WithChildren'
import { twMerge } from 'tailwind-merge'
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'
import Label from '@/components/Primitives/Label/Label'
import Button from '@/components/Primitives/Button/Button'
import { IModal } from '@/interfaces/IPrimitives/IModal/IModal'

const Modal = forwardRef<HTMLDivElement, WithChildren<IModal>>(
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
            'flex flex-col bg-white shadow-md',
            isDrawer
              ? 'h-dvh max-h-dvh w-full rounded-none sm:w-full md:w-105'
              : 'h-auto max-h-[min(90dvh,720px)] w-[min(92vw,520px)] rounded-lg',
            className,
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
            <div className="flex shrink-0 items-center justify-between rounded-t-lg bg-color-primary py-1 px-6 text-color-background z-modal">
              {isDrawer ? (
                <Button
                  id="button-close"
                  type={EButtonType.secondary}
                  size={EButtonSize.small}
                  icon={{
                    name: IconComponentsEnum.arrowLeft,
                    size: ESize.md,
                    color: 'text-primary-500',
                  }}
                  iconPosition="only"
                  onClick={closeModal}
                  className="mr-3"
                />
              ) : (
                <div className="w-8 mr-3" />
              )}
              <div className="flex flex-col flex-1">
                <Label color="text-gray-900" variant={EVariantLabel.h5}>{title}</Label>
                <Label color="text-gray-900" variant={EVariantLabel.bodySmall}>{subTitle}</Label>
              </div>
            </div>
          )}
          <div
            className={twMerge(
              isDrawer
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'flex-1 overflow-auto',
              bodyClassName,
            )}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    )
  }
)

Modal.displayName = 'Modal'

export default Modal
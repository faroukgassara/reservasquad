import { forwardRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
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
    const tCommon = useTranslations('common')
    // Drawers sit on the inline-end edge, so they slide in from the left in RTL.
    const drawerOffset = typeof document !== 'undefined' && document.documentElement.dir === 'rtl' ? -1000 : 1000

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
              ? 'h-dvh max-h-dvh w-full rounded-none sm:w-105'
              : 'h-auto max-h-[min(90dvh,720px)] w-[min(92vw,520px)] rounded-lg',
            className,
          )}
          ref={ref}
          initial={isDrawer ? { x: drawerOffset } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={isDrawer ? { x: drawerOffset } : { opacity: 0, y: -20 }}
          transition={{ ease: "easeInOut", duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          data-modal="true"
        >
          {canClose && (
            <div
              className={twMerge(
                'z-modal flex shrink-0 items-center gap-3 rounded-t-lg px-4 sm:px-6',
                isDrawer ? 'border-b border-gray-100 py-4' : 'items-start pt-4 sm:pt-6',
              )}
            >
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
                  aria-label={tCommon('close')}
                  className="rtl:-scale-x-100"
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label color="text-gray-900" variant={EVariantLabel.h5}>{title}</Label>
                {subTitle ? (
                  <Label color="text-gray-500" variant={EVariantLabel.bodySmall}>{subTitle}</Label>
                ) : null}
              </div>
              {isDrawer ? null : (
                <Button
                  id="button-close"
                  type={EButtonType.tertiary}
                  size={EButtonSize.small}
                  icon={{
                    name: IconComponentsEnum.close,
                    size: ESize.md,
                    color: 'text-gray-500',
                  }}
                  iconPosition="only"
                  onClick={closeModal}
                  aria-label={tCommon('close')}
                  className="-me-2 shrink-0"
                />
              )}
            </div>
          )}
          <div
            className={twMerge(
              isDrawer
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : twMerge('flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6', canClose ? 'pt-4 sm:pt-5' : 'pt-4 sm:pt-6'),
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

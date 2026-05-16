'use client'

import { toast, ToastOptions as ReactToastifyOptions } from 'react-toastify'
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
} from 'react'
import WithChildren from '@/types/WithChildren'
import { ESize, EToastType, IconComponentsEnum } from '@/Enum/Enum'
import type { ELabelColor } from '@/theme/labelColors'
import colors from '@/theme/colors'
import { TToastContextProps, TToastOptions } from '@/types'
import { DEFAULT_TOAST_DURATION_IN_MS } from '@/common'
import AtomIcon from '@/components/Atoms/AtomIcon/AtomIcon'

const toastConfigs: Record<
    EToastType,
    {
        accentColor: string
        iconColorClass: ELabelColor
        iconBackgroundColor: string
        iconBorderColor: string
        iconName: keyof typeof IconComponentsEnum
    }
> = {
    [EToastType.ERROR]: {
        accentColor: colors.danger[600],
        iconColorClass: 'text-danger-600',
        iconBackgroundColor: colors.danger[25],
        iconBorderColor: colors.danger[100],
        iconName: 'close',
    },
    [EToastType.SUCCESS]: {
        accentColor: colors.success[600],
        iconColorClass: 'text-success-600',
        iconBackgroundColor: colors.success[25],
        iconBorderColor: colors.success[100],
        iconName: 'check',
    },
    [EToastType.INFO]: {
        accentColor: colors.primary[600],
        iconColorClass: 'text-primary-600',
        iconBackgroundColor: colors.primary[25],
        iconBorderColor: colors.primary[100],
        iconName: 'info',
    },
    [EToastType.WARNING]: {
        accentColor: colors.warning[700],
        iconColorClass: 'text-warning-700',
        iconBackgroundColor: colors.warning[25],
        iconBorderColor: colors.warning[100],
        iconName: 'info',
    },
}

const ToastContext = createContext<TToastContextProps>({
    openToast: () => undefined,
    closeToast: () => undefined,
})

const CustomToastContent: React.FC<{
    title: ReactNode
    message: ReactNode
    icon: ReactNode
    accentColor: string
    iconBackgroundColor: string
    iconBorderColor: string
    onClickToast?: () => void
}> = ({
    title,
    message,
    icon,
    accentColor,
    iconBackgroundColor,
    iconBorderColor,
    onClickToast,
}) => (
        <div
            className={`flex items-start gap-3 w-full px-2 py-1 ${onClickToast ? 'cursor-pointer' : ''}`}
            onClick={onClickToast}
        >
            <div
                className="flex size-7 items-center justify-center rounded-full shrink-0 border"
                style={{
                    color: accentColor,
                    backgroundColor: iconBackgroundColor,
                    borderColor: iconBorderColor,
                }}
            >
                {icon}
            </div>
            <div className="flex-1 pr-7">
                <div
                    className="text-base font-semibold text-gray-900 leading-5"
                >
                    {title}
                </div>
                <div className="mt-1 text-sm font-normal leading-5 text-gray-700">
                    {message}
                </div>
            </div>
        </div>
    )

const ToastProvider = ({ children }: WithChildren) => {
    const openToast = useCallback(
        (
            title: ReactNode,
            message: ReactNode,
            options: TToastOptions = {},
            toastId: string = ''
        ) => {
            const type = options.type || EToastType.INFO
            const config = toastConfigs[type]

            const toastOptions: ReactToastifyOptions = {
                position: options.position || 'top-right',
                autoClose: options.duration ?? DEFAULT_TOAST_DURATION_IN_MS,
                hideProgressBar: true,
                closeButton: options.withoutCloseButton
                    ? false
                    : ({ closeToast }) => (
                        <button
                            onClick={closeToast}
                            className="absolute right-2 top-2 z-10 flex p-1 text-gray-500 transition-colors hover:text-gray-700"
                        >
                            <AtomIcon
                                name={IconComponentsEnum.close}
                                size="w-3.5 h-3.5"
                                color="text-gray-500"
                            />
                        </button>
                    ),
                className:
                    'rounded-xxl border border-gray-200 p-0 shadow-lg min-h-fit w-full max-w-[32rem] relative overflow-hidden',
                style: {
                    backgroundColor: colors.white,
                },
                toastId: toastId || undefined,
            }

            const icon = options.icon ? (
                <AtomIcon
                    name={options.icon}
                    color={(options.iconColor as ELabelColor | undefined) || config.iconColorClass}
                    size={options.iconSize || ESize.sm}
                />
            ) : (
                <AtomIcon
                    name={config.iconName}
                    color={config.iconColorClass}
                    size={ESize.sm}
                />
            )

            toast(
                <CustomToastContent
                    title={title}
                    message={message}
                    icon={icon}
                    accentColor={config.accentColor}
                    iconBackgroundColor={config.iconBackgroundColor}
                    iconBorderColor={config.iconBorderColor}
                    onClickToast={options.onClickToast}
                />,
                toastOptions
            )
        },
        []
    )

    const closeToast = useCallback((id?: string) => {
        if (id) {
            toast.dismiss(id)
            return
        }
        toast.dismiss()
    }, [])

    return (
        <ToastContext.Provider value={{ openToast, closeToast }}>
            {children}
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider

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
import { TToastContextProps, TToastOptions } from '@/types'
import Icon from '@/components/Primitives/Icon/Icon'

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
        accentColor: 'var(--ds-danger-600)',
        iconColorClass: 'text-danger-600',
        iconBackgroundColor: 'var(--ds-danger-25)',
        iconBorderColor: 'var(--ds-danger-100)',
        iconName: 'close',
    },
    [EToastType.SUCCESS]: {
        accentColor: 'var(--ds-success-600)',
        iconColorClass: 'text-success-600',
        iconBackgroundColor: 'var(--ds-success-25)',
        iconBorderColor: 'var(--ds-success-100)',
        iconName: 'check',
    },
    [EToastType.INFO]: {
        accentColor: 'var(--ds-primary-600)',
        iconColorClass: 'text-primary-600',
        iconBackgroundColor: 'var(--ds-primary-25)',
        iconBorderColor: 'var(--ds-primary-100)',
        iconName: 'info',
    },
    [EToastType.WARNING]: {
        accentColor: 'var(--ds-warning-700)',
        iconColorClass: 'text-warning-700',
        iconBackgroundColor: 'var(--ds-warning-25)',
        iconBorderColor: 'var(--ds-warning-100)',
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
            role='none'
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
                autoClose: options.duration ?? 5000,
                hideProgressBar: true,
                closeButton: options.withoutCloseButton
                    ? false
                    : ({ closeToast }) => (
                        <button
                            onClick={closeToast}
                            className="absolute right-2 top-2 z-10 flex p-1 text-gray-500 transition-colors hover:text-gray-700"
                        >
                            <Icon
                                name={IconComponentsEnum.close}
                                size={ESize.md}
                                color="text-gray-500"
                            />
                        </button>
                    ),
                className:
                    'rounded-xxl border border-gray-200 p-0 shadow-lg min-h-fit w-full max-w-[32rem] relative overflow-hidden',
                style: {
                    backgroundColor: 'var(--ds-white)',
                },
                toastId: toastId || undefined,
            }

            const icon = options.icon ? (
                <Icon
                    name={options.icon}
                    color={(options.iconColor as ELabelColor | undefined) || config.iconColorClass}
                    size={options.iconSize as ESize || ESize.sm}
                />
            ) : (
                <Icon
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

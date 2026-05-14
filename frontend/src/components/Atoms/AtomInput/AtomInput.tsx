import useDisableNumberInputScroll from '@/hooks/useDisableNumberInputScroll';
import { IAtomInput } from '@/interfaces';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const AtomInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, IAtomInput>(
    (
        {
            error,
            className,
            disabled,
            readOnly,
            id,
            isTextArea,
            rows,
            type = 'text',
            value,
            ...rest
        },
        ref
    ) => {
        const defaultClassName = [
            'w-full py-2 rounded-lg px-3 text-gray-900',
            'placeholder:text-gray-500 placeholder:text-sm',
            'border border-gray-300',
            'shadow-sm',
            'outline-none focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
        ];

        if (className) defaultClassName.push(className);

        if (error) {
            defaultClassName.push(
                'border-danger-300',
                'focus:ring-danger-300',
                'focus:border-danger-300',
                'focus-within:border-danger-300 focus-within:ring-4 focus-within:ring-danger-50'
            );
        }

        useDisableNumberInputScroll()
        const mergedClassName = twMerge(defaultClassName.join(' '))

        return (
            <>
                {isTextArea ? (
                    <textarea
                        ref={ref as any}
                        className={mergedClassName}
                        disabled={disabled}
                        id={`${id}-textarea`}
                        readOnly={readOnly}
                        rows={rows}
                        value={value}
                        {...rest as any}
                    />
                ) : (
                    <input
                        ref={ref as any}
                        type={type}
                        className={mergedClassName}
                        disabled={disabled}
                        id={id}
                        readOnly={readOnly}
                        value={value}
                        {...rest}
                    />)
                }
            </>
        )
    }
)

AtomInput.displayName = 'AtomInput'

export default AtomInput
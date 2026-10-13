'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import { twMerge } from 'tailwind-merge';

interface IThemeToggle {
    className?: string;
}

const ThemeToggle = ({ className }: IThemeToggle = {}) => {
    const { resolvedTheme, setTheme } = useTheme();
    const t = useTranslations('common');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <button
            type="button"
            id="theme-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={t('toggleTheme')}
            className={twMerge(
                'relative inline-flex h-9 items-center rounded-full border border-gray-200 bg-gray-100 p-0.5 transition-colors duration-200 dark:border-gray-300 dark:bg-gray-25 select-none cursor-pointer shadow-2xs hover:border-gray-300 dark:hover:border-gray-200',
                className,
            )}
        >
            <span
                className={twMerge(
                    'flex size-7 items-center justify-center rounded-full transition-all duration-200',
                    !isDark
                        ? 'bg-white text-warning-500 shadow-sm border border-gray-200/60'
                        : 'text-gray-400 hover:text-warning-400',
                )}
            >
                <Icon
                    name={IconComponentsEnum.sun}
                    size={ESize.xs}
                    color={!isDark ? 'text-warning-500' : 'text-gray-400'}
                />
            </span>
            <span
                className={twMerge(
                    'flex size-7 items-center justify-center rounded-full transition-all duration-200',
                    isDark
                        ? 'bg-primary-600 text-white shadow-sm ring-1 ring-primary-300/60'
                        : 'text-gray-400 hover:text-primary-600',
                )}
            >
                <Icon
                    name={IconComponentsEnum.moon}
                    size={ESize.xs}
                    color={isDark ? 'text-white' : 'text-gray-400'}
                />
            </span>
        </button>
    );
};

export default ThemeToggle;

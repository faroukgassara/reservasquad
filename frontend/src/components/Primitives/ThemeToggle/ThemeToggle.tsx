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
                'relative inline-flex h-9 items-center rounded-full border border-gray-200 bg-gray-100 p-0.5 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800 select-none cursor-pointer',
                className,
            )}
        >
            <span
                className={twMerge(
                    'flex size-7 items-center justify-center rounded-full transition-all duration-200',
                    !isDark
                        ? 'bg-white text-warning-500 shadow-xs'
                        : 'text-gray-400 hover:text-gray-200',
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
                        ? 'bg-gray-900 text-primary-400 shadow-xs dark:bg-gray-950 dark:text-primary-300'
                        : 'text-gray-400 hover:text-gray-600',
                )}
            >
                <Icon
                    name={IconComponentsEnum.moon}
                    size={ESize.xs}
                    color={isDark ? 'text-primary-300' : 'text-gray-400'}
                />
            </span>
        </button>
    );
};

export default ThemeToggle;

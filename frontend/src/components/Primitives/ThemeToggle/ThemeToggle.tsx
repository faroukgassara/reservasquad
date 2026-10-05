'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';

const ThemeToggle = () => {
    const { resolvedTheme, setTheme } = useTheme();
    const t = useTranslations('common');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <Button
            id="theme-toggle"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{
                name: isDark ? IconComponentsEnum.sun : IconComponentsEnum.moon,
                size: ESize.md,
                color: 'text-primary-500',
            }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={t('toggleTheme')}
            className="shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );
};

export default ThemeToggle;

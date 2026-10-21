'use client';

import { twMerge } from 'tailwind-merge';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';

export interface IModuleCardStat {
    label: string;
    value: string;
}

export type TModuleCardTone = 'primary' | 'accent' | 'success' | 'warning';

const TONES: Record<
    TModuleCardTone,
    { header: string; hoverBorder: string; dot: string; soft: string; text: ELabelColor }
> = {
    primary: {
        header: 'bg-gradient-to-br from-primary-700 via-primary-600 to-primary-400',
        hoverBorder: 'hover:border-primary-300',
        dot: 'bg-primary-500',
        soft: 'bg-primary-50',
        text: 'text-primary-600',
    },
    accent: {
        header: 'bg-gradient-to-br from-accent-700 via-accent-600 to-accent-400',
        hoverBorder: 'hover:border-accent-300',
        dot: 'bg-accent-500',
        soft: 'bg-accent-50',
        text: 'text-accent-600',
    },
    success: {
        header: 'bg-gradient-to-br from-success-700 via-success-600 to-success-400',
        hoverBorder: 'hover:border-success-300',
        dot: 'bg-success-500',
        soft: 'bg-success-50',
        text: 'text-success-700',
    },
    warning: {
        header: 'bg-gradient-to-br from-warning-700 via-warning-600 to-warning-400',
        hoverBorder: 'hover:border-warning-300',
        dot: 'bg-warning-500',
        soft: 'bg-warning-50',
        text: 'text-warning-700',
    },
};

interface IModuleCard {
    id: string;
    href: string;
    icon: IconComponentsEnum;
    tone: TModuleCardTone;
    title: string;
    description: string;
    stats?: IModuleCardStat[];
    shortcuts?: string[];
    isLoading?: boolean;
    openLabel: string;
}

const ModuleCard = ({
    id,
    href,
    icon,
    tone,
    title,
    description,
    stats = [],
    shortcuts = [],
    isLoading = false,
    openLabel,
}: IModuleCard) => {
    const toneClasses = TONES[tone];

    return (
        <Link
            id={`module-card-${id}`}
            href={href}
            className={twMerge(
                'group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
                toneClasses.hoverBorder,
            )}
        >
            <Div className={twMerge('relative overflow-hidden px-5 pb-6 pt-5', toneClasses.header)}>
                <Div aria-hidden="true" className="absolute -end-8 -top-10 size-32 rounded-full bg-white/10" />
                <Div aria-hidden="true" className="absolute -bottom-12 end-10 size-24 rounded-full bg-white/10" />
                <Div className="relative flex flex-col gap-4">
                    <Div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                        <Icon name={icon} size={ESize.md} color="text-white" />
                    </Div>
                    <Div className="flex flex-col gap-1">
                        <Label variant={EVariantLabel.h5} color="text-white" className="cursor-pointer truncate">
                            {title}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-white" className="cursor-pointer line-clamp-2 opacity-85">
                            {description}
                        </Label>
                    </Div>
                </Div>
            </Div>

            <Div className="flex flex-1 flex-col gap-4 p-5">
                {isLoading ? (
                    <Div className="flex flex-col gap-2.5">
                        {[0, 1, 2].map((row) => (
                            <Div key={row} className="h-5 animate-pulse rounded-md bg-gray-100" />
                        ))}
                    </Div>
                ) : null}

                {!isLoading && stats.length > 0 ? (
                    <Div className="flex flex-col gap-2.5">
                        {stats.map((stat) => (
                            <Div key={stat.label} className="flex items-center justify-between gap-3">
                                <Div className="flex min-w-0 items-center gap-2">
                                    <span className={twMerge('size-1.5 shrink-0 rounded-full', toneClasses.dot)} />
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="cursor-pointer truncate">
                                        {stat.label}
                                    </Label>
                                </Div>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="cursor-pointer shrink-0 font-bold tabular-nums"
                                >
                                    {stat.value}
                                </Label>
                            </Div>
                        ))}
                    </Div>
                ) : null}

                {shortcuts.length > 0 ? (
                    <Div className="flex flex-wrap gap-2">
                        {shortcuts.map((shortcut) => (
                            <span key={shortcut} className={twMerge('rounded-full px-3 py-1', toneClasses.soft)}>
                                <Label variant={EVariantLabel.caption} color={toneClasses.text} className="cursor-pointer font-medium">
                                    {shortcut}
                                </Label>
                            </span>
                        ))}
                    </Div>
                ) : null}

                <Div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <Label variant={EVariantLabel.bodySmall} color={toneClasses.text} className="cursor-pointer font-semibold">
                        {openLabel}
                    </Label>
                    <Div
                        className={twMerge(
                            'flex size-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1',
                            toneClasses.soft,
                        )}
                    >
                        <Icon name={IconComponentsEnum.arrowRight} size={ESize.sm} color={toneClasses.text} className="rtl:-scale-x-100" />
                    </Div>
                </Div>
            </Div>
        </Link>
    );
};

export default ModuleCard;

'use client';

import { twMerge } from 'tailwind-merge';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Skeleton from '@/components/Primitives/Skeleton/Skeleton';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { ELabelColor } from '@/theme/labelColors';
import type { ModuleTone } from '@/lib/navigation';

export interface IModuleCardStat {
    label: string;
    value: string;
}

type TModuleCardTone = ModuleTone;

// Solid fills must keep white text at AA contrast; the dark theme inverts tone scales, hence the dark: shades.
const TONES: Record<
    TModuleCardTone,
    { tile: string; solid: string; arrowHover: string; watermark: ELabelColor }
> = {
    primary: {
        tile: 'border-primary-25 bg-primary-10',
        solid: 'bg-primary-500',
        arrowHover: 'group-hover:border-primary-500 group-hover:bg-primary-500',
        watermark: 'text-primary-500',
    },
    accent: {
        tile: 'border-accent-50 bg-accent-25/50',
        solid: 'bg-accent-500 dark:bg-accent-300',
        arrowHover:
            'group-hover:border-accent-500 group-hover:bg-accent-500 dark:group-hover:border-accent-300 dark:group-hover:bg-accent-300',
        watermark: 'text-accent-500',
    },
    success: {
        tile: 'border-success-100 bg-success-25',
        solid: 'bg-success-700 dark:bg-success-300',
        arrowHover:
            'group-hover:border-success-700 group-hover:bg-success-700 dark:group-hover:border-success-300 dark:group-hover:bg-success-300',
        watermark: 'text-success-700',
    },
    warning: {
        tile: 'border-warning-100 bg-warning-25',
        solid: 'bg-warning-800 dark:bg-warning-300',
        arrowHover:
            'group-hover:border-warning-800 group-hover:bg-warning-800 dark:group-hover:border-warning-300 dark:group-hover:bg-warning-300',
        watermark: 'text-warning-800',
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
    const [headline, ...details] = stats;

    return (
        <Link
            id={`module-card-${id}`}
            href={href}
            className={twMerge(
                'group relative isolate flex h-full cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl border p-6 transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0',
                toneClasses.tile,
            )}
        >
            <span aria-hidden className="pointer-events-none absolute -bottom-8 -end-8 -z-10 opacity-[0.07]">
                <Icon name={icon} size="size-44" color={toneClasses.watermark} />
            </span>

            <Div className="flex items-start justify-between gap-3">
                <Div className={twMerge('flex size-11 items-center justify-center rounded-2xl', toneClasses.solid)}>
                    <Icon name={icon} size={ESize.md} color="text-white" />
                </Div>
                <Div
                    className={twMerge(
                        'flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors duration-200',
                        toneClasses.arrowHover,
                    )}
                >
                    <Icon
                        name={IconComponentsEnum.chevronRight}
                        size={ESize.sm}
                        color="text-gray-700"
                        className="group-hover:text-white rtl:-scale-x-100"
                    />
                    <Label variant={EVariantLabel.caption} color="text-gray-700" className="sr-only">
                        {openLabel}
                    </Label>
                </Div>
            </Div>

            <Div className="flex flex-col gap-1">
                <Label variant={EVariantLabel.h5} color="text-gray-900" className="cursor-pointer font-bold! truncate">
                    {title}
                </Label>
                <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="cursor-pointer line-clamp-2">
                    {description}
                </Label>
            </Div>

            {isLoading ? (
                <Div className="mt-auto flex flex-col gap-3">
                    <Skeleton className="h-9 w-24 bg-gray-200/60" />
                    <Skeleton className="h-5 w-full bg-gray-200/50" />
                </Div>
            ) : null}

            {!isLoading && headline ? (
                <dl className="mt-auto flex flex-col">
                    <Div className="flex flex-col-reverse pb-3">
                        <dt>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="cursor-pointer">
                                {headline.label}
                            </Label>
                        </dt>
                        <dd>
                            <Label
                                variant={EVariantLabel.h3}
                                color="text-gray-900"
                                className="cursor-pointer font-bold! tabular-nums break-words"
                            >
                                {headline.value}
                            </Label>
                        </dd>
                    </Div>
                    {details.map((stat) => (
                        <Div
                            key={stat.label}
                            className="flex items-baseline justify-between gap-3 border-t border-gray-900/10 py-2"
                        >
                            <dt className="min-w-0">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="cursor-pointer">
                                    {stat.label}
                                </Label>
                            </dt>
                            <dd className="shrink-0">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="cursor-pointer font-semibold! tabular-nums"
                                >
                                    {stat.value}
                                </Label>
                            </dd>
                        </Div>
                    ))}
                </dl>
            ) : null}

            {shortcuts.length > 0 ? (
                <Div className="mt-auto flex flex-wrap gap-2">
                    {shortcuts.map((shortcut) => (
                        <span key={shortcut} className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            <Label variant={EVariantLabel.caption} color="text-gray-700" className="cursor-pointer font-medium">
                                {shortcut}
                            </Label>
                        </span>
                    ))}
                </Div>
            ) : null}
        </Link>
    );
};

export default ModuleCard;

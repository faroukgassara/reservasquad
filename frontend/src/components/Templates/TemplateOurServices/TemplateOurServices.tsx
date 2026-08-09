'use client';

import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

const SERVICE_KEYS = ['laser', 'design', 'print', 'gifts', 'vinyl'] as const;

const SERVICE_ICONS: Record<(typeof SERVICE_KEYS)[number], IconComponentsEnum> = {
    laser: IconComponentsEnum.scissors,
    design: IconComponentsEnum.penNib,
    print: IconComponentsEnum.printer,
    gifts: IconComponentsEnum.gift,
    vinyl: IconComponentsEnum.car,
};

export default function TemplateOurServices() {
    const t = useTranslations('home.services');
    const locale = useLocale();
    const isRtl = locale === 'ar';

    return (
        <Div
            role="region"
            aria-labelledby="our-services-heading"
            dir={isRtl ? 'rtl' : 'ltr'}
            className={twMerge(
                'flex flex-col overflow-hidden bg-gray-25',
                'h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]',
            )}
        >
            <Div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <Div className="mb-4 max-w-3xl shrink-0 sm:mb-5 lg:mb-6">
                    <Label
                        variant={EVariantLabel.overline}
                        color="text-gold-600"
                        className="mb-2 block uppercase"
                    >
                        {t('eyebrow')}
                    </Label>
                    <Div id="our-services-heading">
                        <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                            {t('title')}
                        </Label>
                    </Div>
                    <Label
                        variant={EVariantLabel.bodySmall}
                        color="text-gray-600"
                        className="mt-2 block max-w-2xl sm:mt-3"
                    >
                        {t('subtitle')}
                    </Label>
                </Div>

                <Div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-3 sm:gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:gap-5">
                    {SERVICE_KEYS.map((key) => (
                        <Div
                            key={key}
                            className={twMerge(
                                'cursor-pointer group flex min-h-0 flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200',
                                'hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-md hover:shadow-gold-400/10',
                                'sm:p-5 lg:p-6',
                                key === 'vinyl' && 'col-span-2 lg:col-span-1',
                            )}
                        >
                            <span
                                className={twMerge(
                                    'mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors duration-200',
                                    'group-hover:bg-gold-100 group-hover:text-primary-700',
                                    'sm:mb-4 sm:size-11',
                                )}
                            >
                                <Icon
                                    name={SERVICE_ICONS[key]}
                                    size={ESize.md}
                                    color="text-gray-900"
                                    className="transition-colors duration-200 group-hover:text-primary-700"
                                />
                            </span>

                            <Label variant={EVariantLabel.h6} color="text-gray-900" className="block">
                                {t(`items.${key}.title`)}
                            </Label>

                            <Div className='flex items-center justify-between'>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gold-600"
                                    className="mt-1 block"
                                >
                                    {t(`items.${key}.tagline`)}
                                </Label>

                                <Icon
                                    name={IconComponentsEnum.arrowRight}
                                    size={ESize.sm}
                                    color="text-gray-900"
                                    className="transition-colors duration-200 group-hover:text-primary-700"
                                />
                            </Div>
                        </Div>
                    ))}
                </Div>
            </Div>
        </Div>
    );
}

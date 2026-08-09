'use client';

import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import LaserImage from '@/assets/images/hero/laser.jpg';
import GiftsImage from '@/assets/images/hero/gifts.jpg';
import VinylImage from '@/assets/images/hero/vinyl.jpg';
import PrintImage from '@/assets/images/hero/print.jpg';

const FEATURE_KEYS = ['laser', 'packaging', 'delivery', 'custom'] as const;

const FEATURE_ICONS: Record<(typeof FEATURE_KEYS)[number], IconComponentsEnum> = {
    laser: IconComponentsEnum.layers,
    packaging: IconComponentsEnum.gift,
    delivery: IconComponentsEnum.truck,
    custom: IconComponentsEnum.sparkles,
};

const COLLAGE = [
    { key: 'craft', image: VinylImage },
    { key: 'laser', image: LaserImage },
    { key: 'print', image: PrintImage },
    { key: 'gifts', image: GiftsImage },
] as const;

export default function TemplateOurHistory() {
    const t = useTranslations('home.history');
    const locale = useLocale();
    const isRtl = locale === 'ar';

    return (
        <section
            aria-labelledby="our-history-heading"
            dir={isRtl ? 'rtl' : 'ltr'}
            className={twMerge(
                'flex flex-col overflow-x-clip bg-gray-25',
                'h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]',
            )}
        >
            <Div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <Div className="grid min-h-0 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                    <Div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
                        <Div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {COLLAGE.map((item) => (
                                <Div
                                    key={item.key}
                                    className="relative aspect-4/3 overflow-hidden rounded-2xl bg-gray-100"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.image.src}
                                        alt=""
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                </Div>
                            ))}
                        </Div>

                        <Div className="absolute start-1/2 top-1/2 z-10 w-30 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-primary-500 px-4 py-3 text-center shadow-lg sm:w-32 sm:px-5 sm:py-4 rtl:translate-x-1/2">
                            <p className="font-(family-name:--font-poppins) text-2xl font-bold text-white sm:text-3xl">
                                {t('badge.year')}
                            </p>
                            <Label variant={EVariantLabel.caption} color="text-white" className="mt-0.5 block">
                                {t('badge.label')}
                            </Label>
                        </Div>
                    </Div>

                    <Div className="flex min-w-0 flex-col justify-center">
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-accent-600"
                            className="mb-2 block uppercase"
                        >
                            {t('eyebrow')}
                        </Label>
                        <Div id="our-history-heading">
                            <Label variant={EVariantLabel.h2} color="text-gray-900" className="block">
                                {t('title')}
                            </Label>
                        </Div>

                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-600"
                            className="mt-3 block sm:mt-4"
                        >
                            {t('body1')}
                        </Label>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-600"
                            className="mt-2.5 block sm:mt-3"
                        >
                            {t('body2')}
                        </Label>

                        <Div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-3.5">
                            {FEATURE_KEYS.map((key) => (
                                <Div
                                    key={key}
                                    className="flex items-start gap-3 rounded-xl bg-gray-100 px-3.5 py-3 sm:px-4 sm:py-3.5"
                                >
                                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-900 shadow-sm">
                                        <Icon
                                            name={FEATURE_ICONS[key]}
                                            size={ESize.sm}
                                            color="text-gray-900"
                                        />
                                    </span>
                                    <Div className="min-w-0">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block">
                                            {t(`features.${key}.title`)}
                                        </Label>
                                        <Label
                                            variant={EVariantLabel.caption}
                                            color="text-gray-500"
                                            className="mt-0.5 block"
                                        >
                                            {t(`features.${key}.subtitle`)}
                                        </Label>
                                    </Div>
                                </Div>
                            ))}
                        </Div>
                    </Div>
                </Div>
            </Div>
        </section>
    );
}

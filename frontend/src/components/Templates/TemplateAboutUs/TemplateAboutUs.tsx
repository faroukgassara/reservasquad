'use client';

import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

type AboutUsValueItem = {
    name: string;
    description: string;
};

const VALUE_ICONS = [
    IconComponentsEnum.checkCircle,
    IconComponentsEnum.eye,
    IconComponentsEnum.hand,
    IconComponentsEnum.users,
    IconComponentsEnum.clock,
    IconComponentsEnum.settings,
] as const;

function SectionBadge({ children }: Readonly<{ children: string }>) {
    return (
        <Label
            variant={EVariantLabel.overline}
            color="text-primary-600"
            className="mb-3 block uppercase"
        >
            {children}
        </Label>
    );
}

export default function TemplateAboutUs() {
    const locale = useLocale();
    const t = useTranslations('aboutUs');
    const valueItems = t.raw('values.items') as AboutUsValueItem[];
    const isRtl = locale === 'ar';

    return (
        <Div className="bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Qui sommes-nous */}

            {/* Pourquoi Biblio Squad */}
            <Div role="region" aria-labelledby="about-why-heading" className="border-b border-gray-100 bg-gray-50">
                <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <Div className="mx-auto max-w-3xl text-center">
                        <SectionBadge>{t('whyBiblioSquad.badge')}</SectionBadge>
                        <Label
                            variant={EVariantLabel.h2}
                            color="text-gray-900"
                            className="block"
                        >
                            {t('whyBiblioSquad.title')}
                        </Label>
                        <Label
                            variant={EVariantLabel.bodyLarge}
                            color="text-gray-600"
                            className="mx-auto mt-6 block max-w-2xl"
                        >
                            {t('whyBiblioSquad.body')}
                        </Label>
                    </Div>
                </Div>
            </Div>

            {/* Vision & Mission */}
            <Div role="region" aria-labelledby="about-vision-heading" className="border-b border-gray-100">
                <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <Div className="mx-auto max-w-3xl text-center flex flex-col items-center">
                        <SectionBadge>{t('ourVision.badge')}</SectionBadge>
                        <Label
                            variant={EVariantLabel.h2}
                            color="text-gray-900"
                            className="block"
                        >
                            {t('ourVision.title')}
                        </Label>
                        <Label
                            variant={EVariantLabel.bodyLarge}
                            color="text-gray-600"
                            className="mx-auto mt-6 block"
                        >
                            {t('ourVision.body')}
                        </Label>
                    </Div>

                    <Div className="mt-12 grid gap-6 md:grid-cols-2">
                        <Div className="rounded-2xl border border-gold-200 bg-gold-25 p-8 shadow-sm flex flex-col">
                            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gold-100">
                                <Icon name={IconComponentsEnum.eye} size={ESize.md} color="text-gold-600" />
                            </span>
                            <SectionBadge>{t('visionTagline.badge')}</SectionBadge>
                            <Label variant={EVariantLabel.h5} color="text-gray-900" className="mb-3 block">
                                {t('visionTagline.title')}
                            </Label>
                            <Label variant={EVariantLabel.bodyLarge} color="text-gray-700" className="block">
                                {t('visionTagline.body')}
                            </Label>
                        </Div>
                        <Div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-8 shadow-sm flex flex-col ">
                            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-100">
                                <Icon name={IconComponentsEnum.arrowRight} size={ESize.md} color="text-primary-600" />
                            </span>
                            <SectionBadge>{t('mission.badge')}</SectionBadge>
                            <Label variant={EVariantLabel.h5} color="text-gray-900" className="mb-3 block">
                                {t('mission.title')}
                            </Label>
                            <Label variant={EVariantLabel.bodyLarge} color="text-gray-700" className="block">
                                {t('mission.body')}
                            </Label>
                        </Div>
                    </Div>
                </Div>
            </Div>

            {/* Nos valeurs */}
            <Div role="region" aria-labelledby="about-values-heading" className="bg-gray-50">
                <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
                    <Div className="mx-auto max-w-3xl text-center flex flex-col items-center">
                        <SectionBadge>{t('values.badge')}</SectionBadge>
                        <Label
                            variant={EVariantLabel.h2}
                            color="text-gray-900"
                            className="block"
                        >
                            {t('values.title')}
                        </Label>
                    </Div>

                    <Div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
                        {valueItems.map((value, index) => (
                            <Div
                                key={value.name}
                                className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8"
                            >
                                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50">
                                    <Icon
                                        name={VALUE_ICONS[index % VALUE_ICONS.length]}
                                        size={ESize.md}
                                        color="text-primary-600"
                                    />
                                </span>
                                <Label
                                    variant={EVariantLabel.h5}
                                    color="text-primary-600"
                                    className="mb-3 block"
                                >
                                    {value.name}
                                </Label>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-600"
                                    className="block flex-1"
                                >
                                    {value.description}
                                </Label>
                            </Div>
                        ))}
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

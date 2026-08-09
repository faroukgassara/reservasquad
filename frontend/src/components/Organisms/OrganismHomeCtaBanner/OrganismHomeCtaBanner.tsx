'use client';

import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { useTranslations } from 'next-intl';

export default function OrganismHomeCtaBanner() {
    const t = useTranslations('home.ctaBanner');

    return (
        <Div role="region" aria-labelledby="cta-banner-heading" className="bg-black">
            <Div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:flex-row sm:px-6 sm:py-14 sm:text-start lg:px-8">
                <Div id="cta-banner-heading">
                    <Label variant={EVariantLabel.h4} color="text-white" className="block">
                        {t('title')}
                    </Label>
                    <Label variant={EVariantLabel.h4} color="text-gold-400" className="block">
                        {t('highlight')}
                    </Label>
                </Div>
                <Link
                    href={Routes.Contact}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold-400 px-8 py-3.5 text-base font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gold-500"
                >
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                        {t('cta')}
                    </Label>
                    <Icon name={IconComponentsEnum.arrowRight} size={ESize.sm} color="text-gray-900" />
                </Link>
            </Div>
        </Div>
    );
}

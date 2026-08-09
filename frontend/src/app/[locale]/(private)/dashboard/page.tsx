'use client';

import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import { EVariantLabel } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';

export default function ClientPage() {
    const t = useTranslations('dashboard');

    return (
        <LayoutWrapper
            title={t('title')}
            subTitle={t('subtitle')}
            mainSection={
                <Div className="mx-auto max-w-7xl">
                    <Div className="mb-8 sm:mb-10">
                        <Label variant={EVariantLabel.h3} color="text-gray-900">
                            {t('welcome', { brand: 'Biblio Squad' })}
                        </Label>
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-600" className="mt-2">
                            {t('welcomeBody')}
                        </Label>
                    </Div>

                    <Div className="rounded-xxl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                        <Label variant={EVariantLabel.h6} color="text-gray-900" className="mb-4 sm:mb-6">
                            {t('recentActivity')}
                        </Label>
                        <Div className="space-y-4 sm:space-y-6">
                            {[1, 2, 3].map((item) => (
                                <Div
                                    key={item}
                                    className="flex flex-col gap-3 border-b border-gray-50 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4"
                                >
                                    <Div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">
                                        {item}
                                    </Div>
                                    <Div className="min-w-0 flex-1">
                                        <Label variant={EVariantLabel.body} color="text-gray-900">
                                            {t('activityItem')}
                                        </Label>
                                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                                            {t('activityTime')}
                                        </Label>
                                    </Div>
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-primary-600"
                                        className="self-start rounded-full bg-primary-50 px-3 py-1 sm:self-auto"
                                    >
                                        {t('updated')}
                                    </Label>
                                </Div>
                            ))}
                        </Div>
                    </Div>
                </Div>
            }
        />
    );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Div from '@/components/Primitives/Div/Div';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Icon from '@/components/Primitives/Icon/Icon';
import { confirmUnsubscribe, getUnsubscribeInfo } from '@/lib/newsletter-api';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

export default function NewsletterUnsubscribePage() {
    const t = useTranslations('newsletterUnsubscribe');
    const tCommon = useTranslations('common');
    const params = useParams<{ token: string }>();
    const token = params.token;

    const [isConfirmed, setIsConfirmed] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['unsubscribe-info', token],
        queryFn: () => getUnsubscribeInfo(token),
        retry: false,
    });

    const unsubscribeMutation = useMutation({
        mutationFn: () => confirmUnsubscribe(token),
        onSuccess: () => {
            setIsConfirmed(true);
        },
    });

    const alreadyOptedOut = data?.optedOut || isConfirmed;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-12">
            <Div className="w-full max-w-md space-y-6">
                {/* Brand Logo */}
                <Div className="flex justify-center">
                    <BrandLogo alt="Biblio Squad" height={32} className="w-auto object-contain" priority />
                </Div>

                {/* Card Container */}
                <Div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    {isLoading ? (
                        <Div className="flex min-h-48 flex-col items-center justify-center gap-3 py-10">
                            <Spinner size={ESize.lg} color="text-primary-500" />
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                {t('loading')}
                            </Label>
                        </Div>
                    ) : error || !data ? (
                        <Div className="space-y-4 text-center">
                            <Div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
                                <Icon name={IconComponentsEnum.alert} size={ESize.lg} color="text-danger-600" />
                            </Div>
                            <Label variant={EVariantLabel.h4} color="text-gray-900" className="font-bold">
                                {t('errorTitle')}
                            </Label>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                {t('errorDesc')}
                            </Label>
                            <Div className="pt-2">
                                <Link
                                    href="/"
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    {t('backToHome')}
                                </Link>
                            </Div>
                        </Div>
                    ) : alreadyOptedOut ? (
                        <Div className="space-y-4 text-center">
                            <Div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-50 text-success-600">
                                <Icon name={IconComponentsEnum.checkCircle} size={ESize.lg} color="text-success-600" />
                            </Div>
                            <Label variant={EVariantLabel.h4} color="text-gray-900" className="font-bold">
                                {t('unsubscribedTitle')}
                            </Label>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="leading-relaxed">
                                {t('unsubscribedDesc', { email: data.maskedEmail })}
                            </Label>
                            <Div className="pt-2">
                                <Link
                                    href="/"
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    {t('backToHome')}
                                </Link>
                            </Div>
                        </Div>
                    ) : (
                        <Div className="space-y-5 text-center">
                            <Div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                                <Icon name={IconComponentsEnum.bell} size={ESize.lg} color="text-gray-600" />
                            </Div>
                            <Label variant={EVariantLabel.h4} color="text-gray-900" className="font-bold">
                                {t('confirmTitle')}
                            </Label>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="leading-relaxed">
                                {t('confirmQuestion', { email: data.maskedEmail })}
                            </Label>
                            <Div className="pt-2 space-y-3">
                                <Button
                                    id="newsletter-unsubscribe-confirm-btn"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    text={t('confirmAction')}
                                    isLoading={unsubscribeMutation.isPending}
                                    onClick={() => unsubscribeMutation.mutate()}
                                    className="w-full font-bold"
                                />
                                <Link
                                    href="/"
                                    className="block text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline pt-1"
                                >
                                    {tCommon('cancel')}
                                </Link>
                            </Div>
                        </Div>
                    )}
                </Div>
            </Div>
        </div>
    );
}

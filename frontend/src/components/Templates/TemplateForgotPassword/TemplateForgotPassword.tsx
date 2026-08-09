'use client';

import React from 'react';
import ResetPasswordImage from '@/assets/images/reset-password.jpg';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Routes } from '@/lib/routes';
import { ITemplateForgotPassword } from '@/interfaces';
import { EVariantLabel } from '@/Enum/Enum';
import colors from '@/theme/colors';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';

const TemplateForgotPassword: React.FC<ITemplateForgotPassword> = ({
    form,
    showMaxAttemptsHint = false,
}) => {
    const t = useTranslations();

    return (
        <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden lg:flex-row">
            <div className="flex min-h-0 w-full flex-col items-center overflow-y-auto px-4 py-8 sm:py-12 lg:w-1/2 lg:justify-center lg:overflow-hidden lg:py-12">
                <div className="flex w-full max-w-lg flex-col items-center justify-center">
                    <div className="mb-8 flex w-full flex-col items-center text-center">
                        <div className="relative mb-8">
                            <Image
                                src={BiblioSquadLogo}
                                alt="Biblio Squad Logo"
                                width={200}
                                height={50}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <Label
                            color="text-primary-500"
                            className="mb-2 text-primary-500"
                            variant={EVariantLabel.h3}
                        >
                            {t('auth.forgotPasswordTitle')}
                        </Label>
                        {showMaxAttemptsHint && (
                            <Label
                                color="text-danger-600"
                                className="mt-2 text-danger-600"
                                variant={EVariantLabel.hint}
                            >
                                {t('auth.loginAttemptsExceeded')}
                            </Label>
                        )}
                    </div>

                    <form
                        className="w-full"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        <form.Field name="email">
                            {({ state, handleChange }: any) => (
                                <Input
                                    containerClassName="mb-4"
                                    label={t('auth.email')}
                                    placeholder={t('auth.enterYourEmail')}
                                    value={state.value}
                                    id="forgot-password-email"
                                    onChange={(e) => handleChange(e.target.value)}
                                    hintText={state.meta.errors[0]?.message}
                                    error={state.meta.errors[0]}
                                    required
                                />
                            )}
                        </form.Field>

                        <div className="mt-4 flex items-center justify-end mb-4">
                            <Link
                                href={Routes.Login}
                                className="block text-primary-500 text-sm font-semibold hover:underline"
                            >
                                {t('auth.backToLogin')}
                            </Link>
                        </div>

                        <form.Subscribe
                            selector={(state: any) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                        >
                            {([canSubmit, isSubmitting]: [boolean, boolean]) => (
                                <Button
                                    id="forgot-password-submit-btn"
                                    className="group rounded-lg relative w-full flex justify-center"
                                    disabled={!canSubmit}
                                    isLoading={isSubmitting}
                                    text={
                                        isSubmitting
                                            ? t('common.loading')
                                            : t('auth.send')
                                    }
                                    onClick={() => form.handleSubmit()}
                                />
                            )}
                        </form.Subscribe>
                    </form>
                </div>
            </div>

            <div
                className="relative hidden min-h-0 w-1/2 overflow-hidden p-4 lg:flex"
                style={{
                    background: `repeating-linear-gradient(-45deg, ${colors.primary[200]}, ${colors.primary[200]} 1px, transparent 1px, transparent 10px)`,
                }}
            >
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                        src={ResetPasswordImage}
                        alt="Reset password"
                        fill
                        className="object-cover"
                        sizes="50vw"
                        priority
                    />
                </div>
            </div>
        </div>
    );
};

export default TemplateForgotPassword;

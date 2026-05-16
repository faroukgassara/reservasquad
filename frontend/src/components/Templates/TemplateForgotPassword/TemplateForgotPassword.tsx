'use client';

import React from 'react';
import ResetPasswordImage from '@/assets/images/reset-password.jpg';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Routes } from '@/lib/routes';
import { ITemplateForgotPassword } from '@/interfaces';
import { EFontFamily, EVariantLabel } from '@/Enum/Enum';
import colors from '@/theme/colors';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';
import MoleculeButton from '@/components/Molecules/MoleculeButton/MoleculeButton';

const TemplateForgotPassword: React.FC<ITemplateForgotPassword> = ({
    form,
    showMaxAttemptsHint = false,
}) => {
    const t = useTranslations();

    return (
        <div className="h-screen flex flex-row relative overflow-hidden">
            <div className="w-1/2 flex flex-col items-center px-4 py-12">
                <div className="w-full flex-1 flex flex-col items-center justify-center max-w-lg">
                    <div className="flex flex-col items-center text-center w-full mb-8">
                        <div className="relative mb-8">
                            <Image
                                src="/branding/reservasquad-logo.png"
                                alt="Reserva Squad"
                                width={200}
                                height={50}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <AtomLabel
                            color="text-primary-500"
                            className="text-primary-500 mb-2"
                            variant={EVariantLabel.h1}
                            fontFamily={EFontFamily.Display}
                        >
                            {t('auth.forgotPasswordTitle')}
                        </AtomLabel>
                        {showMaxAttemptsHint && (
                            <AtomLabel
                                color="text-danger-600"
                                className="mt-2 text-danger-600"
                                variant={EVariantLabel.hint}
                            >
                                {t('auth.loginAttemptsExceeded')}
                            </AtomLabel>
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
                                <MoleculeInput
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
                                <MoleculeButton
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
                className="flex w-1/2 items-center justify-center relative p-4"
                style={{
                    background: `repeating-linear-gradient(-45deg, ${colors.primary[200]}, ${colors.primary[200]} 1px, transparent 1px, transparent 10px)`,
                }}
            >
                <div className="absolute inset-0 pointer-events-none rounded-xl m-4"></div>
                <Image
                    src={ResetPasswordImage}
                    alt="Field"
                    className="object-cover w-full h-full rounded-xl m-4"
                    priority
                />
            </div>
        </div>
    );
};

export default TemplateForgotPassword;

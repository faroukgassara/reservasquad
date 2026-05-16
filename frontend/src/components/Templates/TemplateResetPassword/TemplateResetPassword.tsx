'use client';

import React from 'react';
import ResetPasswordImage from '@/assets/images/reset-password.jpg';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Routes } from '@/lib/routes';
import { ITemplateResetPassword } from '@/interfaces';
import { EButtonType, EFontFamily, EVariantLabel } from '@/Enum/Enum';
import colors from '@/theme/colors';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeButton from '@/components/Molecules/MoleculeButton/MoleculeButton';
import MoleculeInput from '@/components/Molecules/MoleculeInput/MoleculeInput';

const TemplateResetPassword: React.FC<ITemplateResetPassword> = ({
    variant,
    form,
    isTokenValid = false,
    isValidatingToken = false,
    onCancel,
    onBackToForgotPassword,
}) => {
    const t = useTranslations();

    const rightColumn = (
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
    );

    if (variant === 'invalid') {
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
                                className="text-primary-500 mb-4"
                                variant={EVariantLabel.h1}
                                fontFamily={EFontFamily.Display}
                            >
                                {t('auth.invalidResetToken')}
                            </AtomLabel>
                        </div>
                        <MoleculeButton
                            id="invalid-token-back-forgot-password-btn"
                            className="group rounded-lg relative w-full flex justify-center"
                            onClick={onBackToForgotPassword}
                            text={t('auth.forgotPassword')}
                        />
                    </div>
                </div>
                {rightColumn}
            </div>
        );
    }

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
                            {t('auth.resetPasswordTitle')}
                        </AtomLabel>
                    </div>

                    <form
                        className="w-full"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form?.handleSubmit();
                        }}
                    >
                        <form.Field name="newPassword">
                            {({ state, handleChange }: any) => (
                                <MoleculeInput
                                    containerClassName="mb-4"
                                    label={t('auth.newPassword')}
                                    placeholder={t('auth.enterYourNewPassword')}
                                    value={state.value}
                                    id="reset-password-new-password"
                                    isPassword={true}
                                    type="password"
                                    onChange={(e) =>
                                        handleChange(e.target.value)
                                    }
                                    hintText={state.meta.errors[0]?.message}
                                    error={state.meta.errors[0]}
                                    required
                                />
                            )}
                        </form.Field>

                        <form.Field name="confirmPassword">
                            {({ state, handleChange }: any) => (
                                <MoleculeInput
                                    containerClassName="mb-4"
                                    label={t('auth.confirmPassword')}
                                    placeholder={t('auth.confirmYourPassword')}
                                    value={state.value}
                                    id="reset-password-confirm-password"
                                    isPassword={true}
                                    type="password"
                                    onChange={(e) =>
                                        handleChange(e.target.value)
                                    }
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
                            {([canSubmit, isSubmitting]: [
                                boolean,
                                boolean,
                            ]) => (
                                <div className="flex items-center gap-3 w-full">
                                    <MoleculeButton
                                        id="reset-password-cancel-btn"
                                        className="group rounded-lg relative w-full flex justify-center"
                                        type={EButtonType.secondary}
                                        onClick={(e: any) => {
                                            e.preventDefault();
                                            onCancel?.();
                                        }}
                                        text={t('common.cancel')}
                                    />
                                    <MoleculeButton
                                        id="reset-password-submit-btn"
                                        className="group rounded-lg relative w-full flex justify-center"
                                        disabled={
                                            !canSubmit ||
                                            !isTokenValid ||
                                            isValidatingToken
                                        }
                                        isLoading={
                                            isSubmitting || isValidatingToken
                                        }
                                        text={
                                            isSubmitting || isValidatingToken
                                                ? t('common.loading')
                                                : t('common.save')
                                        }
                                        onClick={() => form.handleSubmit()}
                                    />
                                </div>
                            )}
                        </form.Subscribe>
                    </form>
                </div>
            </div>

            {rightColumn}
        </div>
    );
};

export default TemplateResetPassword;

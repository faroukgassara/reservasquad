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
import { ITemplateResetPassword } from '@/interfaces';
import { EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import colors from '@/theme/colors';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';

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
    );

    if (variant === 'invalid') {
        return (
            <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden lg:flex-row">
                <div className="flex min-h-0 w-full flex-col items-center overflow-y-auto px-4 py-8 sm:py-12 lg:w-1/2 lg:justify-center lg:overflow-hidden lg:py-12">
                    <div className="flex w-full max-w-lg flex-col items-center justify-center">
                        <div className="flex flex-col items-center text-center w-full mb-8">
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
                                className="text-primary-500 mb-4"
                                variant={EVariantLabel.h3}
                            >
                                {t('auth.invalidResetToken')}
                            </Label>
                        </div>
                        <Button
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
                            {t('auth.resetPasswordTitle')}
                        </Label>
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
                                <Input
                                    containerClassName="mb-4"
                                    label={t('auth.newPassword')}
                                    placeholder={t('auth.enterYourNewPassword')}
                                    value={state.value}
                                    id="reset-password-new-password"
                                    isPassword={true}
                                    type={EInputType.password}
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
                                <Input
                                    containerClassName="mb-4"
                                    label={t('auth.confirmPassword')}
                                    placeholder={t('auth.confirmYourPassword')}
                                    value={state.value}
                                    id="reset-password-confirm-password"
                                    isPassword={true}
                                    type={EInputType.password}
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
                                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                                    <Button
                                        id="reset-password-cancel-btn"
                                        className="group rounded-lg relative w-full flex justify-center"
                                        type={EButtonType.secondary}
                                        onClick={(e: any) => {
                                            e.preventDefault();
                                            onCancel?.();
                                        }}
                                        text={t('common.cancel')}
                                    />
                                    <Button
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

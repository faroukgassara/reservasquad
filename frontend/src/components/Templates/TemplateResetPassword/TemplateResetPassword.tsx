'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import { ITemplateResetPassword } from '@/interfaces';
import { EButtonSize, EButtonType, EInputType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

const TemplateResetPassword: React.FC<ITemplateResetPassword> = ({
    variant,
    form,
    isTokenValid = false,
    isValidatingToken = false,
    onCancel,
    onBackToForgotPassword,
}) => {
    const t = useTranslations();

    if (variant === 'invalid') {
        return (
            <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gray-50/60 p-4 transition-colors duration-200 dark:bg-[#0b121e] sm:p-6">
                <div className="mb-3.5 flex w-full max-w-[420px] items-center justify-end gap-2">
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-colors duration-200 dark:border-gray-800/80 dark:bg-[#131b2e] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:p-8">
                    <div className="mb-3 flex justify-center">
                        <BrandLogo
                            alt="Biblio Squad"
                            width={180}
                            height={42}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                    <h1 className="mb-2 text-base font-semibold text-danger-600 dark:text-danger-400 sm:text-lg">
                        {t('auth.invalidResetToken')}
                    </h1>
                    <div className="mt-6">
                        <Button
                            id="invalid-token-back-forgot-password-btn"
                            className="h-11 w-full justify-center rounded-xl font-medium"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            onClick={onBackToForgotPassword}
                            text={t('auth.forgotPassword')}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gray-50/60 p-4 transition-colors duration-200 dark:bg-[#0b121e] sm:p-6">
            {/* Top Controls: LanguageSwitcher & ThemeToggle directly above Card, aligned to right edge */}
            <div className="mb-3.5 flex w-full max-w-[420px] items-center justify-end gap-2">
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
            </div>

            {/* Main Auth Card */}
            <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-colors duration-200 dark:border-gray-800/80 dark:bg-[#131b2e] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:p-8">
                {/* Logo & Title */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-2.5 flex justify-center">
                        <BrandLogo
                            alt="Biblio Squad"
                            width={180}
                            height={42}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        {t('auth.resetPasswordTitle')}
                    </h1>
                </div>

                {/* Form */}
                <form
                    className="w-full"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form?.handleSubmit();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            form?.handleSubmit();
                        }
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
                                onChange={(e) => handleChange(e.target.value)}
                                hintText={state.meta.errors[0]?.message}
                                error={state.meta.errors[0]}
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="confirmPassword">
                        {({ state, handleChange }: any) => (
                            <Input
                                containerClassName="mb-2"
                                label={t('auth.confirmPassword')}
                                placeholder={t('auth.confirmYourPassword')}
                                value={state.value}
                                id="reset-password-confirm-password"
                                isPassword={true}
                                type={EInputType.password}
                                onChange={(e) => handleChange(e.target.value)}
                                hintText={state.meta.errors[0]?.message}
                                error={state.meta.errors[0]}
                                required
                            />
                        )}
                    </form.Field>

                    <div className="mb-6 flex justify-end">
                        <Link
                            href={Routes.Login}
                            className="text-xs font-medium text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
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
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                                <Button
                                    id="reset-password-cancel-btn"
                                    className="h-11 w-full justify-center rounded-xl font-medium sm:w-1/2"
                                    type={EButtonType.secondary}
                                    size={EButtonSize.medium}
                                    onClick={(e: any) => {
                                        e.preventDefault();
                                        onCancel?.();
                                    }}
                                    text={t('common.cancel')}
                                />
                                <Button
                                    id="reset-password-submit-btn"
                                    htmlType="submit"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    icon={{
                                        name: IconComponentsEnum.arrowRight,
                                        size: ESize.xs,
                                        color: 'text-white',
                                    }}
                                    iconPosition="right"
                                    className="h-11 w-full justify-center rounded-xl font-medium rtl:[&_svg]:-scale-x-100 sm:w-1/2"
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
                                    onClick={() => form?.handleSubmit()}
                                />
                            </div>
                        )}
                    </form.Subscribe>
                </form>
            </div>
        </div>
    );
};

export default TemplateResetPassword;

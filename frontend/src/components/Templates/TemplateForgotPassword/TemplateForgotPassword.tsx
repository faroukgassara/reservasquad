'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import { ITemplateForgotPassword } from '@/interfaces';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

const TemplateForgotPassword: React.FC<ITemplateForgotPassword> = ({
    form,
    showMaxAttemptsHint = false,
}) => {
    const t = useTranslations();

    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gray-50/60 p-4 transition-colors duration-200 dark:bg-[#0b121e] sm:p-6">
            {/* Top Controls: LanguageSwitcher & ThemeToggle above Card, aligned to right edge */}
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
                        {t('auth.forgotPasswordTitle')}
                    </h1>
                    {showMaxAttemptsHint && (
                        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">
                            {t('auth.loginAttemptsExceeded')}
                        </p>
                    )}
                </div>

                {/* Form */}
                <form
                    className="w-full"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            form.handleSubmit();
                        }
                    }}
                >
                    <form.Field name="email">
                        {({ state, handleChange }: any) => (
                            <Input
                                containerClassName="mb-3"
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
                            <Button
                                id="forgot-password-submit-btn"
                                htmlType="submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                icon={{
                                    name: IconComponentsEnum.arrowRight,
                                    size: ESize.xs,
                                    color: 'text-white',
                                }}
                                iconPosition="right"
                                className="h-11 w-full justify-center rounded-xl font-medium rtl:[&_svg]:-scale-x-100"
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
    );
};

export default TemplateForgotPassword;

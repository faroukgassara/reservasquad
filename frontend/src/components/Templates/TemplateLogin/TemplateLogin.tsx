'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import { ITemplateLogin } from '@/interfaces';
import { EButtonSize, EButtonType, EInputType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

const TemplateLogin: React.FC<ITemplateLogin> = ({ form }) => {
    const t = useTranslations();
    const [rememberSession, setRememberSession] = useState(false);

    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gray-50/60 p-4 transition-colors duration-200 dark:bg-[#0b121e] sm:p-6">
            {/* Top Controls: LanguageSwitcher & ThemeToggle directly above Card, aligned to right edge */}
            <div className="mb-3.5 flex w-full max-w-[420px] items-center justify-end gap-2">
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
            </div>

            {/* Main Auth Card */}
            <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-colors duration-200 dark:border-gray-800/80 dark:bg-[#131b2e] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:p-8">
                {/* Logo & Subtitle */}
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
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400 sm:text-sm">
                        {t('auth.modalLoginSubtitle')}
                    </p>
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
                                containerClassName="mb-4"
                                label={t('auth.email')}
                                placeholder={t('auth.enterYourEmail')}
                                value={state.value}
                                id="login-email"
                                onChange={(e) => handleChange(e.target.value)}
                                hintText={state.meta.errors[0]?.message}
                                error={state.meta.errors[0]}
                                required
                            />
                        )}
                    </form.Field>

                    <form.Field name="password">
                        {({ state, handleChange }: any) => (
                            <Input
                                containerClassName="mb-1"
                                label={t('auth.password')}
                                isPassword={true}
                                type={EInputType.password}
                                placeholder={t('auth.enterYourPassword')}
                                value={state.value}
                                id="login-password"
                                onChange={(e) => handleChange(e.target.value)}
                                hintText={state.meta.errors[0]?.message}
                                error={state.meta.errors[0]}
                                required
                            />
                        )}
                    </form.Field>

                    {/* Forgot password link aligned right */}
                    <div className="mb-4 flex justify-end">
                        <Link
                            href={Routes.ForgotPassword}
                            className="text-xs font-medium text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                        >
                            {t('auth.forgotPasswordTitle')}
                        </Link>
                    </div>

                    {/* Remember this session checkbox */}
                    <label className="mb-6 flex cursor-pointer select-none items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={rememberSession}
                            onChange={(e) => setRememberSession(e.target.checked)}
                            className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span>{t('auth.rememberSession')}</span>
                    </label>

                    {/* Submit Button */}
                    <form.Subscribe
                        selector={(state: any) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]: [boolean, boolean]) => (
                            <Button
                                id="login-submit-btn"
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
                                text={isSubmitting ? t('common.loading') : t('auth.signIn')}
                                onClick={() => form.handleSubmit()}
                            />
                        )}
                    </form.Subscribe>
                </form>
            </div>
        </div>
    );
};

export default TemplateLogin;

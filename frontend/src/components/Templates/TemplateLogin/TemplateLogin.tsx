'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AnyFieldApi, AnyFormState } from '@tanstack/react-form';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import Label from '@/components/Primitives/Label/Label';
import { ITemplateLogin } from '@/interfaces';
import { EButtonSize, EButtonType, EInputType, EVariantLabel } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

const TemplateLogin: React.FC<ITemplateLogin> = ({ form }) => {
    const t = useTranslations();

    return (
        <div className="grid min-h-dvh bg-white transition-colors duration-200 laptop:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="relative hidden flex-col justify-end gap-10 overflow-hidden bg-primary-700 px-12 pb-14 pt-24 laptop:flex xl:px-16">
                <span aria-hidden className="ds-bookmark absolute start-12 top-0 h-16 w-6 bg-accent-500 xl:start-16" />
                <Label variant={EVariantLabel.h2} color="text-white" className="block max-w-md">
                    {t('auth.panelTitle')}
                </Label>
                <ul className="flex max-w-md flex-col">
                    {(['panelRooms', 'panelPos', 'panelIncome'] as const).map((key) => (
                        <li key={key} className="border-t border-primary-500 py-3.5">
                            <Label variant={EVariantLabel.h6} color="text-primary-100">
                                {t(`auth.${key}`)}
                            </Label>
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="flex flex-col p-4 sm:p-6">
                <div className="flex items-center justify-end gap-2">
                    <LanguageSwitcher menuPlacement="top" className="w-auto" />
                    <ThemeToggle />
                </div>

                <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
                    <div className="mb-8 flex flex-col items-start gap-3">
                        <BrandLogo
                            alt="Biblio Squad"
                            width={180}
                            height={42}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                        <Label variant={EVariantLabel.h4} color="text-gray-900" className="mt-6 block">
                            {t('auth.login')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {t('auth.modalLoginSubtitle')}
                        </Label>
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
                            {({ state, handleChange }: AnyFieldApi) => (
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
                            {({ state, handleChange }: AnyFieldApi) => (
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
                        <div className="mb-6 flex justify-end">
                            <Link
                                href={Routes.ForgotPassword}
                                className="text-xs font-medium text-gray-500 transition-colors hover:text-primary-600"
                            >
                                {t('auth.forgotPasswordTitle')}
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <form.Subscribe selector={(state: AnyFormState) => [state.canSubmit, state.isSubmitting]}>
                            {([canSubmit, isSubmitting]: boolean[]) => (
                                <Button
                                    id="login-submit-btn"
                                    htmlType="submit"
                                    type={EButtonType.primary}
                                    size={EButtonSize.medium}
                                    className="h-11 w-full justify-center rounded-xl"
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
        </div>
    );
};

export default TemplateLogin;

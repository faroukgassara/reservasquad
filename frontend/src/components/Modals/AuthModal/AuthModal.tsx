'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { signIn, getSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { registerAccount } from '@/lib/auth-api';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { Routes } from '@/lib/routes';

type AuthTab = 'login' | 'register';

interface AuthModalProps {
    initialTab?: AuthTab;
    onLoginSuccess?: () => void;
}

export default function AuthModal({
    initialTab = 'login',
    onLoginSuccess,
}: Readonly<AuthModalProps>) {
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [tab, setTab] = useState<AuthTab>(initialTab);
    const [error, setError] = useState<string | null>(null);
    const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loginForm = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            setError(null);
            setIsLoading(true);
            try {
                const result = await signIn('credentials', {
                    email: value.email.trim(),
                    password: value.password,
                    redirect: false,
                });

                if (result?.error) {
                    setError(t('loginFailed'));
                    return;
                }

                const session = await getSession();
                if (!session) {
                    setError(t('loginFailed'));
                    return;
                }

                closeModal();
                onLoginSuccess?.();
                // Session cookie is set; refresh UI without forcing navigation
                window.location.reload();
            } catch {
                setError(t('loginFailed'));
            } finally {
                setIsLoading(false);
            }
        },
    });

    const registerForm = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
        onSubmit: async ({ value }) => {
            setError(null);
            setRegisterSuccess(null);

            if (value.password !== value.confirmPassword) {
                setError(t('validation.passwordsDoNotMatch'));
                return;
            }

            setIsLoading(true);
            try {
                const result = await registerAccount({
                    firstName: value.firstName.trim(),
                    lastName: value.lastName.trim(),
                    email: value.email.trim(),
                    phone: value.phone.trim(),
                    password: value.password,
                });
                setRegisterSuccess(result.message || t('registerSuccess'));
                registerForm.reset();
            } catch (err) {
                setError(err instanceof Error ? err.message : t('registerFailed'));
            } finally {
                setIsLoading(false);
            }
        },
    });

    const switchTab = (next: AuthTab) => {
        setTab(next);
        setError(null);
        setRegisterSuccess(null);
    };

    let submitLabel = tab === 'login' ? t('signIn') : t('register');
    if (isLoading) {
        submitLabel = tCommon('loading');
    }

    return (
        <Modal
            canClose={false}
            canCloseOnClickOutisde
            className="w-[min(94vw,28rem)] max-h-[calc(100dvh-1.5rem)] overflow-hidden"
            bodyClassName="overflow-visible p-0"
        >
            <Div className="flex flex-col">
                <Div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
                    <Div className="min-w-0 flex-1 pr-2 flex flex-col">
                        <Label variant={EVariantLabel.h5} color="text-gray-900">
                            {tab === 'login' ? t('login') : t('register')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="mt-0.5 block">
                            {tab === 'login' ? t('modalLoginSubtitle') : t('modalRegisterSubtitle')}
                        </Label>
                    </Div>
                    <Button
                        id="auth-modal-close"
                        type={EButtonType.tertiary}
                        size={EButtonSize.medium}
                        iconPosition="only"
                        icon={{
                            name: IconComponentsEnum.close,
                            size: ESize.sm,
                            color: 'text-gray-600',
                        }}
                        onClick={closeModal}
                        aria-label={tCommon('close')}
                    />
                </Div>

                <Div className="flex gap-1 border-b border-gray-100 px-4 pt-3 sm:px-5">
                    {(['login', 'register'] as const).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => switchTab(key)}
                            className={twMerge(
                                'cursor-pointer rounded-t-lg px-3 py-2 text-sm font-medium transition-colors',
                                tab === key
                                    ? 'border-b-2 border-primary-500 text-primary-600'
                                    : 'text-gray-500 hover:text-gray-800',
                            )}
                        >
                            {key === 'login' ? t('signIn') : t('register')}
                        </button>
                    ))}
                </Div>

                <Div className="max-h-[min(70dvh,32rem)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                    {registerSuccess && (
                        <Div className="mb-4 rounded-lg border border-success-200 bg-success-50 px-3 py-2">
                            <Label variant={EVariantLabel.bodySmall} color="text-success-700">
                                {registerSuccess}
                            </Label>
                        </Div>
                    )}

                    {error && (
                        <Div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
                            <Label variant={EVariantLabel.bodySmall} color="text-danger-700">
                                {error}
                            </Label>
                        </Div>
                    )}

                    {tab === 'login' ? (
                        <form
                            className="flex flex-col gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void loginForm.handleSubmit();
                            }}
                        >
                            <loginForm.Field name="email">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-login-email"
                                        label={t('email')}
                                        type={EInputType.email}
                                        placeholder={t('enterYourEmail')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </loginForm.Field>
                            <loginForm.Field name="password">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-login-password"
                                        label={t('password')}
                                        isPassword
                                        type={EInputType.password}
                                        placeholder={t('enterYourPassword')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </loginForm.Field>
                            <div className="mb-4 mt-4 flex items-center justify-end">
                                <Link
                                    href={Routes.ForgotPassword}
                                    className="block text-sm font-semibold text-primary-500 hover:underline"
                                >
                                    {t('forgotPassword')}
                                </Link>
                            </div>
                            <Button
                                id="auth-login-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={submitLabel}
                                disabled={isLoading}
                                onClick={() => void loginForm.handleSubmit()}
                                className="mt-1 w-full"
                            />
                        </form>
                    ) : (
                        <form
                            className="flex flex-col gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void registerForm.handleSubmit();
                            }}
                        >
                            <Div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <registerForm.Field name="firstName">
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="auth-register-firstName"
                                            label={t('firstName')}
                                            placeholder={t('placeholders.firstName')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            required
                                        />
                                    )}
                                </registerForm.Field>
                                <registerForm.Field name="lastName">
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="auth-register-lastName"
                                            label={t('lastName')}
                                            placeholder={t('placeholders.lastName')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            required
                                        />
                                    )}
                                </registerForm.Field>
                            </Div>
                            <registerForm.Field name="email">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-register-email"
                                        label={t('email')}
                                        type={EInputType.email}
                                        placeholder={t('enterYourEmail')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </registerForm.Field>
                            <registerForm.Field name="phone">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-register-phone"
                                        label={tCommon('phone')}
                                        placeholder={t('placeholders.phone')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </registerForm.Field>
                            <registerForm.Field name="password">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-register-password"
                                        label={t('password')}
                                        isPassword
                                        type={EInputType.password}
                                        placeholder={t('enterYourPassword')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </registerForm.Field>
                            <registerForm.Field name="confirmPassword">
                                {({ state, handleChange }) => (
                                    <Input
                                        id="auth-register-confirmPassword"
                                        label={t('confirmPassword')}
                                        isPassword
                                        type={EInputType.password}
                                        placeholder={t('confirmYourPassword')}
                                        value={state.value}
                                        onChange={(e) => handleChange(e.target.value)}
                                        required
                                    />
                                )}
                            </registerForm.Field>
                            <Button
                                id="auth-register-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={submitLabel}
                                disabled={isLoading}
                                onClick={() => void registerForm.handleSubmit()}
                                className="mt-1 w-full"
                            />
                        </form>
                    )}
                </Div>
            </Div>
        </Modal>
    );
}

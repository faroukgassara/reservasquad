'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Input from '@/components/Primitives/Input/Input';
import LanguageSwitcher from '@/components/Primitives/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import { activateAccount } from '@/lib/auth-api';
import { checkNewPassword } from '@/lib/password-rules';
import { Routes } from '@/lib/routes';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';

type ActivationState = 'form' | 'success' | 'error';

export default function ActivateAccountPage() {
    const t = useTranslations('auth');
    const params = useParams();
    const token = typeof params.token === 'string' ? params.token : '';
    const [state, setState] = useState<ActivationState>(token ? 'form' : 'error');
    const [message, setMessage] = useState(token ? '' : t('invalidActivationToken'));
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = (): string | null => {
        const rule = checkNewPassword(password, confirm);
        return rule ? t(`validation.${rule}`) : null;
    };

    const handleSubmit = async () => {
        const error = validate();
        setFieldError(error);
        if (error) return;

        setIsSubmitting(true);
        try {
            await activateAccount(token, password);
            setState('success');
            setMessage(t('setPasswordSuccess'));
        } catch (err) {
            setState('error');
            setMessage(err instanceof Error ? err.message : t('activateFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Div className="flex min-h-dvh flex-col items-center justify-center bg-gray-25 p-4 transition-colors duration-200 sm:p-6">
            <Div className="mb-3.5 flex w-full max-w-md items-center justify-end gap-2">
                <LanguageSwitcher menuPlacement="top" className="w-auto" />
                <ThemeToggle />
            </Div>
            <Div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                {state === 'form' ? (
                    <Div className="flex flex-col gap-4">
                        <Div className="flex flex-col gap-1 text-center">
                            <Label variant={EVariantLabel.h5} color="text-gray-900">
                                {t('setPasswordTitle')}
                            </Label>
                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                {t('setPasswordSubtitle')}
                            </Label>
                        </Div>
                        <Input
                            id="activate-password"
                            label={t('newPassword')}
                            placeholder={t('enterYourNewPassword')}
                            isPassword
                            required
                            value={password}
                            error={Boolean(fieldError)}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Input
                            id="activate-password-confirm"
                            label={t('confirmPassword')}
                            placeholder={t('confirmYourPassword')}
                            isPassword
                            required
                            value={confirm}
                            error={Boolean(fieldError)}
                            hintText={fieldError ?? undefined}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                        <Button
                            id="activate-submit"
                            type={EButtonType.primary}
                            size={EButtonSize.medium}
                            text={t('setPasswordCta')}
                            isLoading={isSubmitting}
                            onClick={handleSubmit}
                            className="w-full justify-center"
                        />
                    </Div>
                ) : (
                    <Div className="flex flex-col items-center gap-4 text-center">
                        <Label variant={EVariantLabel.h5} color="text-gray-900">
                            {state === 'success' ? t('activateTitle') : t('activateErrorTitle')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {message}
                        </Label>
                        <Link href={Routes.Login}>
                            <Button
                                id="activate-go-login"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={t('backToLogin')}
                            />
                        </Link>
                    </Div>
                )}
            </Div>
        </Div>
    );
}

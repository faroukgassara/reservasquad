'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { activateAccount } from '@/lib/auth-api';
import { Routes } from '@/lib/routes';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';

type ActivationState = 'loading' | 'success' | 'error';

export default function ActivateAccountPage() {
    const t = useTranslations('auth');
    const params = useParams();
    const token = typeof params.token === 'string' ? params.token : '';
    const [state, setState] = useState<ActivationState>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setState('error');
            setMessage(t('invalidActivationToken'));
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                await activateAccount(token);
                if (cancelled) return;
                setState('success');
                setMessage(t('activateSuccess'));
            } catch (error) {
                if (cancelled) return;
                setState('error');
                setMessage(error instanceof Error ? error.message : t('activateFailed'));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token, t]);

    return (
        <Div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
            <Div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
                {state === 'loading' && (
                    <Div className="flex flex-col items-center gap-3">
                        <Spinner color="text-primary-500" size="lg" />
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                            {t('activating')}
                        </Label>
                    </Div>
                )}

                {state !== 'loading' && (
                    <Div className="flex flex-col items-center gap-4">
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

'use client';

import { signIn } from 'next-auth/react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { TemplateResetPassword } from '@/components/Templates';
import { FormSchema } from '@/common/Data/FormSchema';
import { FormDefaultData } from '@/common/Data/FormDefaultData';
import { CommonFunction } from '@/common';
import { Api } from '@/common/StandardApi/api';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import { EToastType } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import { useToast } from '@/contexts/ToastContext';

export default function ResetPasswordPage() {
    const t = useTranslations();
    const formSchema = FormSchema.getInstance(t as any);
    const locale = useLocale();
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const api = new Api();
    const { openToast } = useToast();

    const tokenParam = Array.isArray(params?.token)
        ? params.token[0]
        : params?.token;
    const token = tokenParam ? decodeURIComponent(tokenParam) : '';

    const validateTokenQuery = useQuery({
        queryKey: ['validate-reset-token', token, locale],
        enabled: Boolean(token),
        retry: false,
        queryFn: async () => {
            const headers = await CommonFunction.createHeaders({
                withToken: false,
            });
            const response = await api.post(
                `/api/auth/validate-reset-password-token?lang=${locale}`,
                { token },
                headers,
            );

            return response.status === HttpStatus.SuccessOK;
        },
    });

    const isValidatingToken = Boolean(token) && validateTokenQuery.isPending;
    const isTokenValid = Boolean(token) && validateTokenQuery.data === true;

    type FormData = z.infer<
        ReturnType<typeof formSchema.resetPasswordFormSchema>
    >;
    const defaultValues: FormData =
        FormDefaultData.resetPasswordDefaultValues();

    const form = useForm({
        defaultValues,
        validators: {
            onChange: formSchema.resetPasswordFormSchema(),
            onSubmit: formSchema.resetPasswordFormSchema(),
        },
        onSubmit: async ({ value }) => {
            await handleSubmit(value);
        },
    });

    const handleSubmit = async (payload: {
        newPassword: string;
        confirmPassword: string;
    }) => {
        if (!isTokenValid || isValidatingToken) {
            return;
        }

        try {
            const headers = await CommonFunction.createHeaders({
                withToken: false,
            });
            const response = await api.post(
                `/api/auth/reset-password?lang=${locale}`,
                {
                    token,
                    newPassword: payload.newPassword,
                },
                headers,
            );

            if (response.status !== HttpStatus.SuccessOK) {
                openToast('Error', t('auth.resetPasswordFailed'), {
                    type: EToastType.ERROR,
                });
                return;
            }

            const email = response?.data?.data?.email;

            if (!email) {
                openToast('Error', t('auth.resetPasswordFailed'), {
                    type: EToastType.ERROR,
                });
                router.push(Routes.Login);
                return;
            }

            const signInResult = await signIn('credentials', {
                email,
                password: payload.newPassword,
                rememberMe: true,
                redirect: false,
            });

            if (signInResult?.error) {
                openToast('Success', t('auth.resetPasswordSuccess'), {
                    type: EToastType.SUCCESS,
                });
                router.push(Routes.Login);
                return;
            }

            openToast('Success', t('auth.resetPasswordSuccess'), {
                type: EToastType.SUCCESS,
            });
            router.push('/dashboard');
        } catch {
            openToast('Error', t('auth.resetPasswordFailed'), {
                type: EToastType.ERROR,
            });
        }
    };

    const variant =
        !token || (!isValidatingToken && !isTokenValid) ? 'invalid' : 'valid';

    return (
        <TemplateResetPassword
            variant={variant}
            form={form}
            isTokenValid={isTokenValid}
            isValidatingToken={isValidatingToken}
            onCancel={() => router.push(Routes.Login)}
            onBackToForgotPassword={() => router.push(Routes.ForgotPassword)}
        />
    );
}

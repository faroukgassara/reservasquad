'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormSchema } from '@/common/Data/FormSchema';
import { FormDefaultData } from '@/common/Data/FormDefaultData';
import { CommonFunction } from '@/common';
import { Api } from '@/common/StandardApi/api';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import { Routes } from '@/lib/routes';
import { EToastType } from '@/Enum/Enum';
import { useToast } from '@/contexts/ToastContext';
import TemplateForgotPassword from '@/components/Templates/TemplateForgotPassword/TemplateForgotPassword';

export default function ForgotPasswordPage() {
    const t = useTranslations();
    const formSchema = FormSchema.getInstance(t as any);
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const api = new Api();
    const { openToast } = useToast();
    const showMaxAttemptsHint = searchParams.get('reason') === 'max-attempts';
    type FormData = z.infer<
        ReturnType<typeof formSchema.forgotPasswordFormSchema>
    >;
    const defaultValues: FormData =
        FormDefaultData.forgotPasswordDefaultValues();

    const { mutateAsync: requestResetPasswordMutationAsync } = useMutation({
        mutationFn: async (payload: { email: string }) => {
            const headers = await CommonFunction.createHeaders({
                withToken: false,
            });
            return await api.post(
                `/api/auth/request-reset-password?lang=${locale}`,
                { email: payload.email },
                headers,
            );
        },
    });

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: formSchema.forgotPasswordFormSchema(),
        },
        onSubmit: async ({ value }) => {
            await handleSubmit(value);
        },
    });

    const handleSubmit = async (payload: { email: string }) => {
        try {
            const res = await requestResetPasswordMutationAsync(payload);

            if (res.status !== HttpStatus.SuccessOK) {
                openToast('Error', t('auth.requestResetFailed'), {
                    type: EToastType.ERROR,
                });
                return;
            }

            openToast('Success', t('auth.requestResetSent'), {
                type: EToastType.SUCCESS,
            });
            router.push(Routes.Login);
        } catch {
            openToast('Error', t('auth.requestResetFailed'), {
                type: EToastType.ERROR,
            });
        }
    };

    return (
        <TemplateForgotPassword
            form={form}
            showMaxAttemptsHint={showMaxAttemptsHint}
        />
    );
}

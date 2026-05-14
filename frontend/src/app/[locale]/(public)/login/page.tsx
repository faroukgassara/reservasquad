'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { TemplateLogin } from '@/components/Templates';
import { FormSchema } from '@/common/Data/FormSchema';
import { FormDefaultData } from '@/common/Data/FormDefaultData';
import { useTranslations } from 'next-intl';
import { Routes } from '@/lib/routes';
import { useRef } from 'react';
import { EToastType } from '@/Enum/Enum';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
    const router = useRouter();
    const failedAttemptsRef = useRef(0);
    const t = useTranslations();
    const { openToast } = useToast();
    const formSchema = FormSchema.getInstance(t as any);
    type FormData = z.infer<ReturnType<typeof formSchema.loginFormSchema>>;
    const defaultValues: FormData = FormDefaultData.loginDefaultValues()

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: formSchema.loginFormSchema(),
        },
        onSubmit: async ({ value }) => {
            await handleSubmit(value)
        },
    });

    const handleSubmit = async (user: { email: string, password: string, rememberMe: boolean }) => {
        try {
            const result = await signIn('credentials', {
                email: user.email,
                password: user.password,
                rememberMe: user.rememberMe,
                redirect: false,
            });
            if (result?.error) {
                failedAttemptsRef.current += 1;

                if (failedAttemptsRef.current >= 3) {
                    failedAttemptsRef.current = 0;
                    router.push(`${Routes.ForgotPassword}?reason=max-attempts`);
                    return;
                }

                openToast('Error', t('auth.loginFailed'), {
                    type: EToastType.ERROR,
                });
            } else {
                failedAttemptsRef.current = 0;
                const session = await getSession();
                if (session) {
                    const role = session.user?.role;
                    router.push(role === 'ADMIN' ? Routes.AdminReservations : Routes.Home);
                }
            }
        } catch (error) {
            failedAttemptsRef.current += 1;

            if (failedAttemptsRef.current >= 3) {
                failedAttemptsRef.current = 0;
                router.push(`${Routes.ForgotPassword}?reason=max-attempts`);
                return;
            }

            console.error(t('auth.loginFailed'), error);
            openToast('Error', 'error message !', {
                type: EToastType.ERROR,
            });
        }
    };

    return (
        <div>
    
        <TemplateLogin form={form} /></div>
    );
}

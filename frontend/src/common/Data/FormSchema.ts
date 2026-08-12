import type { useTranslations } from 'next-intl';
import { z } from "zod";

type AuthTranslateFn = ReturnType<typeof useTranslations<'auth'>>;

class FormSchema {
    private static instance: FormSchema
    private t: AuthTranslateFn

    constructor(t: AuthTranslateFn) {
        this.t = t
    }

    public static getInstance(t: AuthTranslateFn): FormSchema {
        if (!FormSchema.instance) {
            FormSchema.instance = new FormSchema(t)
        }
        return FormSchema.instance
    }

    public loginFormSchema() {
        return z.object({
            email: z
                .email(this.t('validation.invalidEmail'))
                .min(1, this.t('validation.emailRequired')),
            password: z
                .string()
                .min(1, this.t('validation.passwordRequired'))
                .max(120, this.t('validation.passwordTooLong')),
        });
    }

    public forgotPasswordFormSchema() {
        return z.object({
            email: z
                .email(this.t('validation.invalidEmail'))
                .min(1, this.t('validation.emailRequired')),
        });
    }

    public resetPasswordFormSchema() {
        return z.object({
            newPassword: z
                .string()
                .min(8, this.t('validation.passwordMinLength'))
                .regex(/[a-z]/, this.t('validation.passwordLowercase'))
                .regex(/[A-Z]/, this.t('validation.passwordUppercase'))
                .regex(/[^A-Za-z0-9]/, this.t('validation.passwordSpecialChar')),
            confirmPassword: z
                .string()
                .min(1, this.t('validation.confirmPasswordRequired')),
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: this.t('validation.passwordsDoNotMatch'),
            path: ['confirmPassword'],
        });
    }
}

export { FormSchema }

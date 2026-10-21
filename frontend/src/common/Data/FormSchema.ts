import type { useTranslations } from 'next-intl';
import { z } from "zod";
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_LOWERCASE_REGEX,
    PASSWORD_UPPERCASE_REGEX,
    PASSWORD_SPECIAL_CHAR_REGEX,
} from '@/lib/password-rules';

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
                .min(PASSWORD_MIN_LENGTH, this.t('validation.passwordMinLength'))
                .max(PASSWORD_MAX_LENGTH, this.t('validation.passwordTooLong'))
                .regex(PASSWORD_LOWERCASE_REGEX, this.t('validation.passwordLowercase'))
                .regex(PASSWORD_UPPERCASE_REGEX, this.t('validation.passwordUppercase'))
                .regex(PASSWORD_SPECIAL_CHAR_REGEX, this.t('validation.passwordSpecialChar')),
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

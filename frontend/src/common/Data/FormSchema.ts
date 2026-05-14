import { useTranslation } from "next-i18next";
import { z } from "zod";

class FormSchema {
    private static instance: FormSchema
    private t: ReturnType<typeof useTranslation>['t']

    constructor(t: ReturnType<typeof useTranslation>['t']) {
        this.t = t
    }

    public static getInstance(t: ReturnType<typeof useTranslation>['t']): FormSchema {
        if (!FormSchema.instance) {
            FormSchema.instance = new FormSchema(t)
        }
        return FormSchema.instance
    }

    public loginFormSchema() {
        return z.object({
            email: z
                .email(this.t('auth.validation.invalidEmail'))
                .min(1, this.t('auth.validation.emailRequired')),
            password: z
                .string()
                .min(1, this.t('auth.validation.passwordRequired'))
                .max(120, this.t('auth.validation.passwordTooLong')),
            rememberMe: z.
                boolean()
        });
    }

    public forgotPasswordFormSchema() {
        return z.object({
            email: z
                .email(this.t('auth.validation.invalidEmail'))
                .min(1, this.t('auth.validation.emailRequired')),
        });
    }

    public resetPasswordFormSchema() {
        return z.object({
            newPassword: z
                .string()
                .min(8, this.t('auth.validation.passwordMinLength'))
                .regex(/[a-z]/, this.t('auth.validation.passwordLowercase'))
                .regex(/[A-Z]/, this.t('auth.validation.passwordUppercase'))
                .regex(/[^A-Za-z0-9]/, this.t('auth.validation.passwordSpecialChar')),
            confirmPassword: z
                .string()
                .min(1, this.t('auth.validation.confirmPasswordRequired')),
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: this.t('auth.validation.passwordsDoNotMatch'),
            path: ['confirmPassword'],
        });
    }

    public static createClientSchema() {
        return z.object({
            entrepriseName: z
                .string()
                .min(1, "Entreprise name is required"),
            contactOneFirstName: z
                .string()
                .min(1, "Contact first name is required"),
            contactOneSecondName: z
                .string()
                .min(1, "Contact second name is required"),
            emailAddressContact1: z
                .email("Invalid email format")
                .min(1, "Email is required"),
            contactOneComment: z
                .string()
                .min(1, "contact 1 comment is required"),
            secondContactFirstName: z
                .string()
                .min(1, "Contact first name is required"),
            secondContactSecondName: z
                .string()
                .min(1, "Contact second name is required"),
            emailAddressContact2: z
                .email("Invalid email format")
                .min(1, "Email is required"),
            secondContactComment: z
                .string()
                .min(1, "Contact 2 comment is required"),
        });
    }
}

export { FormSchema }
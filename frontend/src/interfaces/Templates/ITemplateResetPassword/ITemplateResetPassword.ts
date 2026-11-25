import type { AnyReactForm } from '@/types';

interface ITemplateResetPassword {
    variant: 'invalid' | 'valid';
    form?: AnyReactForm;
    isTokenValid?: boolean;
    isValidatingToken?: boolean;
    onCancel?: () => void;
    onBackToForgotPassword?: () => void;
}

export type { ITemplateResetPassword };

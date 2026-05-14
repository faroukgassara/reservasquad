interface ITemplateResetPassword {
    variant: 'invalid' | 'valid';
    form?: any;
    isTokenValid?: boolean;
    isValidatingToken?: boolean;
    onCancel?: () => void;
    onBackToForgotPassword?: () => void;
}

export type { ITemplateResetPassword };

/** Keys under `auth.validation` — mirrors the backend password rules. */
export type PasswordRuleError =
    | 'passwordRequired'
    | 'passwordMinLength'
    | 'passwordTooLong'
    | 'passwordLowercase'
    | 'passwordUppercase'
    | 'passwordSpecialChar'
    | 'confirmPasswordRequired'
    | 'passwordsDoNotMatch';

export function checkNewPassword(password: string, confirm: string): PasswordRuleError | null {
    if (!password) return 'passwordRequired';
    if (password.length < 8) return 'passwordMinLength';
    if (password.length > 120) return 'passwordTooLong';
    if (!/[a-z]/.test(password)) return 'passwordLowercase';
    if (!/[A-Z]/.test(password)) return 'passwordUppercase';
    if (!/[^A-Za-z0-9]/.test(password)) return 'passwordSpecialChar';
    if (!confirm) return 'confirmPasswordRequired';
    if (confirm !== password) return 'passwordsDoNotMatch';
    return null;
}

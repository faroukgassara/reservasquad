/**
 * Shared password validation constants and rules aligned with the backend.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 120;

export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;
export const PASSWORD_COMPLEXITY_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

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

export function checkNewPassword(
    password: string,
    confirm: string,
): PasswordRuleError | null {
    if (!password) return 'passwordRequired';
    if (password.length < PASSWORD_MIN_LENGTH) return 'passwordMinLength';
    if (password.length > PASSWORD_MAX_LENGTH) return 'passwordTooLong';
    if (!PASSWORD_LOWERCASE_REGEX.test(password)) return 'passwordLowercase';
    if (!PASSWORD_UPPERCASE_REGEX.test(password)) return 'passwordUppercase';
    if (!PASSWORD_SPECIAL_CHAR_REGEX.test(password)) return 'passwordSpecialChar';
    if (!confirm) return 'confirmPasswordRequired';
    if (confirm !== password) return 'passwordsDoNotMatch';
    return null;
}

export function isPasswordComplex(password: string): boolean {
    return (
        typeof password === 'string' &&
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH &&
        PASSWORD_COMPLEXITY_REGEX.test(password)
    );
}

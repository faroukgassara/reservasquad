class FormDefaultData {
    public static loginDefaultValues(): { email: string; password: string } {
        return { email: "", password: '' }
    }

    public static forgotPasswordDefaultValues(): { email: string } {
        return { email: "" }
    }

    public static resetPasswordDefaultValues(): { newPassword: string; confirmPassword: string } {
        return { newPassword: "", confirmPassword: "" }
    }
}

export { FormDefaultData }

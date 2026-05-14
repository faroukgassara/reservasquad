interface IUserDetails {
    email: string;
    password: string;
    fullName?: string | null;
    phone?: string | null;
    isActive: boolean;
    isArchived: boolean;
}

export { IUserDetails }
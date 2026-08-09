import 'next-auth';

interface AuthSessionUser {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
    role?: string;
    tokenVersion?: number;
    imageUrl?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    archivedAt?: string | Date | null;
    deletedAt?: string | Date | null;
}

declare module 'next-auth' {
    interface Session {
        user: AuthSessionUser;
        accessToken?: string;
        error?: string;
    }

    interface User extends AuthSessionUser {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
        expires_in?: number;
        refresh_expires_in?: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        user?: AuthSessionUser;
        error?: string;
    }
}

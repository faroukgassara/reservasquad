import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id?: string;
            email?: string;
            name?: string;
            role?: string;
            tokenVersion?: number;
            createdAt?: string | Date;
            updatedAt?: string | Date;
        };
        accessToken?: string;
        error?: string;
        rememberMe?: boolean;
    }

    interface User {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
        tokenVersion?: number;
        createdAt?: string | Date;
        updatedAt?: string | Date;
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
        expires_in?: number;
        refresh_expires_in?: number;
        rememberMe?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        user?: {
            id?: string;
            email?: string;
            name?: string;
            role?: string;
            tokenVersion?: number;
        };
        rememberMe?: boolean;
        error?: string;
    }
}

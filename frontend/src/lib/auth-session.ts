import { getSession, signOut } from 'next-auth/react';
import { Routes } from '@/lib/routes';

let isSigningOut = false;

export async function forceSignOut(): Promise<void> {
    if (isSigningOut || typeof window === 'undefined') {
        return;
    }

    isSigningOut = true;
    try {
        await signOut({ callbackUrl: Routes.Login });
    } finally {
        isSigningOut = false;
    }
}

/** Refetch session (triggers NextAuth JWT refresh) or sign out if refresh failed. */
export async function refreshSessionOrSignOut(): Promise<boolean> {
    const session = await getSession();

    if (!session?.accessToken || session.error === 'RefreshAccessTokenError') {
        await forceSignOut();
        return false;
    }

    return true;
}

export function hasAuthorizationHeader(headers: Record<string, unknown> | undefined): boolean {
    if (!headers) {
        return false;
    }

    const authorization = headers.Authorization ?? headers.authorization;
    return typeof authorization === 'string' && authorization.length > 0;
}

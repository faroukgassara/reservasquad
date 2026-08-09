'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { forceSignOut } from '@/lib/auth-session';

export default function AuthSessionListener() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated') {
            return;
        }

        if (session?.error === 'RefreshAccessTokenError') {
            void forceSignOut();
        }
    }, [session?.error, status]);

    return null;
}

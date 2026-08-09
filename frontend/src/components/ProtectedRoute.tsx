'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Routes } from '@/lib/routes';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || session.error === 'RefreshAccessTokenError') {
            void signOut({ callbackUrl: Routes.Login });
            router.push(Routes.Login);
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }
    if (!session || session.error === 'RefreshAccessTokenError') {
        return null;
    }

    return <>{children}</>;
}

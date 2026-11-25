'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

export default function PosLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useLockBodyScroll();
    return (
        <ProtectedRoute>
            <NotificationListener />
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">{children}</div>
        </ProtectedRoute>
    );
}

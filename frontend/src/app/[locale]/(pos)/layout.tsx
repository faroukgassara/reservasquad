'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';

export default function PosLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <NotificationListener />
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">{children}</div>
        </ProtectedRoute>
    );
}

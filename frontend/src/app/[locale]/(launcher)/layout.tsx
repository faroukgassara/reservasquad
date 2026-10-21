'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';
import OrganismAppTopBar from '@/components/Organisms/AppTopBar/OrganismAppTopBar';
import { Routes } from '@/lib/routes';

export default function LauncherLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <NotificationListener />
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">
                <OrganismAppTopBar homeHref={Routes.Launcher} showNotifications />
                <main className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 laptop:p-8">{children}</div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

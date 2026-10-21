'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';
import OrganismLauncherNav from '@/components/Organisms/Launcher/OrganismLauncherNav';

export default function LauncherLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <NotificationListener />
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">
                <OrganismLauncherNav />
                <main className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 laptop:p-8">{children}</div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

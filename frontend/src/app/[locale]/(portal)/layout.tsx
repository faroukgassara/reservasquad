'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import OrganismPortalNav from '@/components/Organisms/Portal/OrganismPortalNav';

export default function PortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">
                <OrganismPortalNav />
                <main className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 laptop:p-8">{children}</div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

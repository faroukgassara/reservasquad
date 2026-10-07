'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function PosLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">{children}</div>
        </ProtectedRoute>
    );
}

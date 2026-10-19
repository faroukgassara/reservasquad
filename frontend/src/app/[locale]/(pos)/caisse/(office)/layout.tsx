'use client';

import { TopSectionGlobalControlsContext } from '@/components/Organisms/OrganismTopSection/OrganismTopSection';
import OrganismPosNav from '@/components/Organisms/Pos/OrganismPosNav';

export default function PosOfficeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <OrganismPosNav />
            <TopSectionGlobalControlsContext.Provider value={false}>
                <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
            </TopSectionGlobalControlsContext.Provider>
        </>
    );
}

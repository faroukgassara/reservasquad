'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import OrganismFrontofficeFooter from '@/components/Organisms/OrganismFrontofficeFooter';
import OrganismFrontofficeHeader from '@/components/Organisms/OrganismFrontofficeHeader';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';

/** No marketing chrome on auth flows, calendar app, or admin shell */
const HIDE_MARKETING_PREFIXES = [
    '/calendar',
    '/admin',
    '/login',
    '/forgot-password',
    '/reset-password',
] as const;

function normalizePathname(pathname: string): string {
    const p = pathname.split('?')[0] || '/';
    for (const loc of routing.locales) {
        if (p === `/${loc}`) return '/';
        if (p.startsWith(`/${loc}/`)) {
            const rest = p.slice(`/${loc}`.length) || '/';
            return rest.startsWith('/') ? rest : `/${rest}`;
        }
    }
    return p;
}

function shouldShowMarketingShell(pathname: string): boolean {
    const path = normalizePathname(pathname);
    return !HIDE_MARKETING_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
}

export default function LocaleMarketingShell({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname() || '/';

    if (!shouldShowMarketingShell(pathname)) {
        return <>{children}</>;
    }

    return (
        <AtomDiv className="flex min-h-screen flex-col bg-white">
            <OrganismFrontofficeHeader />
            <AtomDiv className="flex min-h-0 flex-1 flex-col">{children}</AtomDiv>
            <OrganismFrontofficeFooter />
        </AtomDiv>
    );
}

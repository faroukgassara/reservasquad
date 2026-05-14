'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Div } from '@/components/Atoms';
import OrganismFrontofficeFooter from '@/components/Organisms/OrganismFrontofficeFooter';
import OrganismFrontofficeHeader from '@/components/Organisms/OrganismFrontofficeHeader';

/** Back-office and auth: no marketing header/footer (private layout or login flows handle UI). */
const BACKOFFICE_AND_AUTH_PREFIXES = [
    '/dashboard',
    '/formations',
    '/formation-categories',
    '/blogs',
    '/contact-messages',
    '/clients',
    '/resources',
    '/archive',
    '/projects',
    '/calendar',
    '/my-reservations',
    '/admin',
    '/notifications',
    '/configuration',
    '/login',
    '/register',
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
    return !BACKOFFICE_AND_AUTH_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
}

export default function LocaleMarketingShell({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname() || '/';

    if (!shouldShowMarketingShell(pathname)) {
        return <>{children}</>;
    }

    return (
        <Div className="flex min-h-screen flex-col bg-white">
            <OrganismFrontofficeHeader />
            <Div className="flex min-h-0 flex-1 flex-col">{children}</Div>
            <OrganismFrontofficeFooter />
        </Div>
    );
}

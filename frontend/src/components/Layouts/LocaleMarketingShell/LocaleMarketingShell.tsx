'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Routes } from '@/lib/routes';
import Div from '@/components/Primitives/Div/Div';
import OrganismFrontofficeFooter from '@/components/Organisms/OrganismFrontofficeFooter/OrganismFrontofficeFooter';
import OrganismFrontofficeHeader from '@/components/Organisms/OrganismFrontofficeHeader/OrganismFrontofficeHeader';

/** Back-office and auth: no marketing header/footer (private layout or login flows handle UI). */
const BACKOFFICE_AND_AUTH_PREFIXES = [
    Routes.Dashboard,
    Routes.Products.index,
    Routes.ProductCategories.index,
    Routes.Faqs.index,
    Routes.FaqCategories.index,
    Routes.ContactMessages.index,
    Routes.Orders.index,
    Routes.Testimonials.index,
    Routes.Clients.index,
    Routes.Quotes.index,
    Routes.Invoices.index,
    Routes.Users.index,
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
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
        <Div className="flex min-h-dvh flex-col overflow-x-clip bg-white">
            <OrganismFrontofficeHeader />
            <Div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">{children}</Div>
            <OrganismFrontofficeFooter />
        </Div>
    );
}

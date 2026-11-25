'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import OrganismAppTopBar, { IAppTopBarLink } from '@/components/Organisms/AppTopBar/OrganismAppTopBar';
import ModuleSwitcher from '@/components/Organisms/ModuleSwitcher/ModuleSwitcher';
import NotificationListener from '@/components/Organisms/Notifications/NotificationListener';
import { Routes } from '@/lib/routes';
import { moduleForPath, moduleItemsForRole, modulesForRole } from '@/lib/navigation';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

export default function PrivateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useLockBodyScroll();
    const t = useTranslations('sidebar');
    const { data: session } = useSession();
    const role = session?.user?.role;
    const pathname = usePathname();

    const availableModules = useMemo(() => modulesForRole(role), [role]);
    const currentModule = moduleForPath(pathname) ?? availableModules[0];

    const links: IAppTopBarLink[] = useMemo(
        () =>
            currentModule
                ? moduleItemsForRole(currentModule, role).map((item) => ({
                      href: item.href,
                      label: t(item.labelKey),
                      exact: item.exact,
                      alsoActive: item.alsoActive,
                      children: item.children?.map((child) => ({
                          href: child.href,
                          label: t(child.labelKey),
                          exact: child.exact,
                          alsoActive: child.alsoActive,
                      })),
                  }))
                : [],
        [currentModule, role, t],
    );

    return (
        <ProtectedRoute>
            <NotificationListener />
            <div className="flex h-dvh flex-col overflow-hidden bg-gray-25">
                <OrganismAppTopBar
                    homeHref={Routes.Launcher}
                    showNotifications
                    links={links}
                    center={
                        currentModule ? (
                            <ModuleSwitcher current={currentModule} modules={availableModules} />
                        ) : null
                    }
                />
                <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            </div>
        </ProtectedRoute>
    );
}


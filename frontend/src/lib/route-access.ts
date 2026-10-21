import { IAccessPolicy, IAuthzContext, canAccess } from './authz';
import { Routes } from './routes';

interface IRoutePolicy {
    route: string;
    policy: IAccessPolicy;
}

/** Path-based access policies. Most admin pages use in-page `useAuthorization` instead. */
export const ROUTE_POLICIES: IRoutePolicy[] = [
    { route: Routes.Reservations.reports, policy: { anyRoles: ['ADMIN'] } },
    { route: Routes.DailyIncome.index, policy: { anyRoles: ['ADMIN'] } },
    { route: Routes.Users.index, policy: { anyRoles: ['ADMIN'] } },
    { route: Routes.AuditLog.index, policy: { anyRoles: ['ADMIN'] } },
    { route: Routes.RecycleBin.index, policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/sessions', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/sales', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/invoices', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/products', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/categories', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/analytics', policy: { anyRoles: ['ADMIN'] } },
    { route: '/caisse/newsletters', policy: { anyRoles: ['ADMIN'] } },
    { route: Routes.Portal.index, policy: { anyRoles: ['PROFESSOR'] } },
];

const isUnder = (path: string, route: string) => path === route || path.startsWith(`${route}/`);

export const isRouteAllowed = (path: string, context: IAuthzContext): boolean => {
    // Professors only ever see their portal.
    if (context.role === 'PROFESSOR') {
        return isUnder(path, Routes.Portal.index);
    }

    const matchedPolicy = ROUTE_POLICIES.find((entry) => isUnder(path, entry.route));

    if (!matchedPolicy) {
        return true;
    }

    return canAccess(context, matchedPolicy.policy);
};

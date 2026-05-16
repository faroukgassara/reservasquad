import { IAccessPolicy, IAuthzContext, canAccess } from './authz';

interface IRoutePolicy {
    route: string;
    policy: IAccessPolicy;
}

export const ROUTE_POLICIES: IRoutePolicy[] = [
    {
        route: '/admin',
        policy: {
            anyRoles: ['ADMIN'],
        },
    },
];

export const isRouteAllowed = (path: string, context: IAuthzContext): boolean => {
    const matchedPolicy = ROUTE_POLICIES.find(
        (entry) => path === entry.route || path.startsWith(`${entry.route}/`),
    );

    if (!matchedPolicy) {
        return true;
    }

    return canAccess(context, matchedPolicy.policy);
};

export interface IAuthzContext {
    role?: string;
}

export interface IAccessPolicy {
    anyRoles?: string[];
}

const hasRole = (context: IAuthzContext, allowedRoles: string[]): boolean => {
    if (!context.role) return false;
    return allowedRoles.includes(context.role);
};

export const canAccess = (context: IAuthzContext, policy: IAccessPolicy): boolean => {
    return !policy.anyRoles || policy.anyRoles.length === 0 || hasRole(context, policy.anyRoles);
};

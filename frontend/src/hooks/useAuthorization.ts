'use client';

import { useSession } from 'next-auth/react';
import {
    canAccess,
    IAccessPolicy,
    IAuthzContext,
} from '@/lib/authz';

export const useAuthorization = () => {
    const { data: session } = useSession();

    const context: IAuthzContext = {
        role: session?.user?.role,
    };

    const isAllowed = (policy: IAccessPolicy): boolean => canAccess(context, policy);

    const withAuthorization = <T extends (...args: any[]) => any>(
        policy: IAccessPolicy,
        action: T,
        onUnauthorized?: () => void,
    ) => {
        return (...args: Parameters<T>) => {
            if (!isAllowed(policy)) {
                onUnauthorized?.();
                return;
            }

            return action(...args);
        };
    };

    return {
        role: context.role,
        isAllowed,
        withAuthorization,
    };
};

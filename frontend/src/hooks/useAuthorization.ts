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

    const withAuthorization = <TArgs extends unknown[], TResult>(
        policy: IAccessPolicy,
        action: (...args: TArgs) => TResult,
        onUnauthorized?: () => void,
    ) => {
        return (...args: TArgs) => {
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

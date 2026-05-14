'use client';

import { ReactNode } from 'react';
import { IAccessPolicy } from '@/lib/authz';
import { useAuthorization } from '@/hooks/useAuthorization';

interface RoleGateProps {
    policy: IAccessPolicy;
    children: ReactNode;
    fallback?: ReactNode;
}

export default function RoleGate({ policy, children, fallback = null }: Readonly<RoleGateProps>) {
    const { isAllowed } = useAuthorization();

    if (!isAllowed(policy)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

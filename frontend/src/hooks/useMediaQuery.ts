'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query without hydration mismatches.
 * SSR + first hydration always use `getServerSnapshot` (false);
 * the real viewport value applies after mount.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const mediaQuery = window.matchMedia(query);
            mediaQuery.addEventListener('change', onStoreChange);
            return () => mediaQuery.removeEventListener('change', onStoreChange);
        },
        [query],
    );

    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

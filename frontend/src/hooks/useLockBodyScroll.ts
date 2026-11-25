'use client';

import { useEffect } from 'react';

/**
 * Locks the window (document and body) scrollbars for application shell layouts
 * where scrolling is exclusively handled by an internal container (<main className="overflow-y-auto">).
 * Prevents double scrollbars from appearing on Windows/desktop browsers.
 */
export function useLockBodyScroll() {
    useEffect(() => {
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
        };
    }, []);
}

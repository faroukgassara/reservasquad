'use client';

import { useEffect } from 'react';

const SCROLLABLE_SELECTOR = '[data-scroll-lock-scrollable]';

function isMobileViewport() {
    return window.matchMedia('(max-width: 1279px)').matches;
}

function shouldPadForScrollbar() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    return scrollbarWidth > 0 && window.matchMedia('(min-width: 1280px)').matches;
}

/**
 * Locks document scroll while `locked` is true.
 * Mobile: position fixed without scrollbar padding (padding causes right-side gap).
 * Desktop: position fixed with scrollbar padding when a scrollbar is visible.
 */
export function useBodyScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) return;

        const scrollY = window.scrollY;
        const mobile = isMobileViewport();

        const previous = {
            bodyPosition: document.body.style.position,
            bodyTop: document.body.style.top,
            bodyLeft: document.body.style.left,
            bodyRight: document.body.style.right,
            bodyWidth: document.body.style.width,
            bodyPaddingRight: document.body.style.paddingRight,
            bodyOverflow: document.body.style.overflow,
            bodyTouchAction: document.body.style.touchAction,
            htmlOverflow: document.documentElement.style.overflow,
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.documentElement.style.overflow = 'hidden';

        if (!mobile && shouldPadForScrollbar()) {
            document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
        }

        const onTouchMove = (event: TouchEvent) => {
            const target = event.target;
            if (target instanceof Element && target.closest(SCROLLABLE_SELECTOR)) {
                return;
            }
            event.preventDefault();
        };

        document.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            document.body.style.position = previous.bodyPosition;
            document.body.style.top = previous.bodyTop;
            document.body.style.left = previous.bodyLeft;
            document.body.style.right = previous.bodyRight;
            document.body.style.width = previous.bodyWidth;
            document.body.style.paddingRight = previous.bodyPaddingRight;
            document.body.style.overflow = previous.bodyOverflow;
            document.body.style.touchAction = previous.bodyTouchAction;
            document.documentElement.style.overflow = previous.htmlOverflow;
            document.removeEventListener('touchmove', onTouchMove);
            window.scrollTo(0, scrollY);
        };
    }, [locked]);
}

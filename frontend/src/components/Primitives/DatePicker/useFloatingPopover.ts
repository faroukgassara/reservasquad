'use client';

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
} from 'react';

const VIEWPORT_PADDING = 8;
const POPOVER_GAP = 4;
export const FLOATING_POPOVER_Z_INDEX = 10000;

export interface IFloatingPopoverPosition {
    top: number;
    left: number;
}

export function useFloatingPopover(isOpen: boolean) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState<IFloatingPopoverPosition | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const popover = popoverRef.current;
        if (!trigger || !popover) return;

        const triggerRect = trigger.getBoundingClientRect();
        const popoverWidth = popover.offsetWidth;
        const popoverHeight = popover.offsetHeight;

        let left = triggerRect.left;
        if (left + popoverWidth > window.innerWidth - VIEWPORT_PADDING) {
            left = triggerRect.right - popoverWidth;
        }
        left = Math.max(
            VIEWPORT_PADDING,
            Math.min(left, window.innerWidth - popoverWidth - VIEWPORT_PADDING),
        );

        let top = triggerRect.bottom + POPOVER_GAP;
        if (top + popoverHeight > window.innerHeight - VIEWPORT_PADDING) {
            const aboveTop = triggerRect.top - popoverHeight - POPOVER_GAP;
            if (aboveTop >= VIEWPORT_PADDING) {
                top = aboveTop;
            } else {
                top = Math.max(
                    VIEWPORT_PADDING,
                    window.innerHeight - popoverHeight - VIEWPORT_PADDING,
                );
            }
        }

        setPosition({ top, left });
    }, []);

    useLayoutEffect(() => {
        if (!isOpen) {
            setPosition(null);
            return;
        }

        const frame = requestAnimationFrame(() => {
            updatePosition();
            requestAnimationFrame(updatePosition);
        });
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const popoverStyle: CSSProperties | undefined = position
        ? {
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: FLOATING_POPOVER_Z_INDEX,
              visibility: 'visible',
          }
        : {
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: FLOATING_POPOVER_Z_INDEX,
              visibility: 'hidden',
          };

    return {
        mounted,
        triggerRef,
        popoverRef,
        popoverStyle,
        isPositioned: position !== null,
    };
}

'use client';

import { useState } from 'react';
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    shift,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import zIndex from '@/theme/zIndex';
import type { ITooltip } from '@/interfaces/IPrimitives/ITooltip/ITooltip';

const Tooltip = ({ content, children, placement = 'right', disabled = false, className }: ITooltip) => {
    const [open, setOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: open && !disabled,
        onOpenChange: setOpen,
        placement,
        whileElementsMounted: autoUpdate,
        middleware: [offset(10), flip(), shift({ padding: 8 })],
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        useHover(context, { move: false }),
        useFocus(context),
        useDismiss(context),
        useRole(context, { role: 'tooltip' }),
    ]);

    if (disabled) return <>{children}</>;

    return (
        <>
            <div ref={refs.setReference} className={className} {...getReferenceProps()}>
                {children}
            </div>
            {open ? (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={{ ...floatingStyles, zIndex: zIndex.tooltip }}
                        className="pointer-events-none rounded-lg bg-gray-900 px-2.5 py-1.5 shadow-lg"
                        {...getFloatingProps()}
                    >
                        <Label variant={EVariantLabel.caption} color="text-gray-25" className="whitespace-nowrap font-medium">
                            {content}
                        </Label>
                    </div>
                </FloatingPortal>
            ) : null}
        </>
    );
};

export default Tooltip;

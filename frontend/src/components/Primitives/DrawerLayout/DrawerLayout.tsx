'use client';

import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/** Full-height column wrapper for drawer forms — scrollable body + pinned footer. */
export function DrawerForm({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
    return <form {...props} className={twMerge('flex h-full min-h-0 flex-col', className)} />;
}

/** Scrollable drawer content area (fields, filters, etc.). */
export function DrawerScrollContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={twMerge('flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto', className)}
        />
    );
}

/** Pinned action row at the bottom of a drawer — matches FormationFiltersModal. */
export function DrawerActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={twMerge(
                'mt-auto flex shrink-0 gap-3 border-t border-gray-200 p-6',
                className,
            )}
        />
    );
}

/** Non-form drawer shell (header + scroll + footer slots). */
export function DrawerBody({
    className,
    children,
}: Readonly<{ className?: string; children: ReactNode }>) {
    return (
        <div className={twMerge('flex h-full min-h-0 flex-col p-6', className)}>{children}</div>
    );
}

import { twMerge } from 'tailwind-merge';
import type ISkeleton from '@/interfaces/IPrimitives/ISkeleton/ISkeleton';

/** Pulse placeholder for a line of text or a compact value. */
const Skeleton = ({ className = '' }: ISkeleton) => (
    <span
        aria-hidden
        className={twMerge('inline-block animate-pulse rounded-md bg-gray-100', className)}
    />
);

export default Skeleton;

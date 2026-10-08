'use client';

import Image, { ImageProps } from 'next/image';
import { twMerge } from 'tailwind-merge';
import logoLight from '@/assets/images/bibliosquad-logo.png';
import logoDark from '@/assets/images/bibliosquad-logo-dark.png';

type BrandLogoProps = Omit<ImageProps, 'src'>;

export default function BrandLogo({ alt, className, ...props }: BrandLogoProps) {
    return (
        <>
            <Image
                src={logoLight}
                alt={alt}
                className={twMerge('dark:hidden', className)}
                {...props}
            />
            <Image
                src={logoDark}
                alt={alt}
                className={twMerge('hidden dark:block', className)}
                {...props}
            />
        </>
    );
}

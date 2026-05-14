'use client';

import { Link } from '@/i18n/navigation';
import { Div, Label } from '@/components/Atoms';
import { EFontFamily, EVariantLabel } from '@/Enum/Enum';

const productLinks = [
    { href: '/courses', label: 'Overview' },
    { href: '/courses', label: 'Features' },
    { href: '/courses', label: 'Solutions' },
    { href: '/courses', label: 'Tutorials' },
    { href: '/courses', label: 'Pricing' },
] as const;

const companyLinks = [
    { href: '/aboutus', label: 'About us' },
    { href: '/contact', label: 'Careers' },
    { href: '/faq', label: 'Press', badge: 'New' },
    { href: '/blog', label: 'News' },
] as const;

const socialLinks = [
    { href: 'https://twitter.com', label: 'Twitter' },
    { href: 'https://linkedin.com', label: 'LinkedIn' },
    { href: 'https://github.com', label: 'GitHub' },
    { href: 'https://dribbble.com', label: 'Dribbble' },
] as const;

const legalLinks = [
    { href: '/faq', label: 'Terms' },
    { href: '/faq', label: 'Privacy' },
    { href: '/faq', label: 'Cookies' },
    { href: '/contact', label: 'Contact' },
] as const;

const footerSocialIcons = [
    {
        href: 'https://twitter.com',
        label: 'Twitter',
        path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
        href: 'https://linkedin.com',
        label: 'LinkedIn',
        path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    },
    {
        href: 'https://facebook.com',
        label: 'Facebook',
        path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
        href: 'https://github.com',
        label: 'GitHub',
        path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    },
    {
        href: 'https://dribbble.com',
        label: 'Dribbble',
        path: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.392-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.005-5.055 8.225-6.766.134-.043.27-.084.405-.123-.273-.614-.57-1.227-.882-1.823-5.1 1.526-9.99 1.464-10.44 1.457-.003.082-.003.164-.003.246 0 2.63.98 5.034 2.695 6.91zm-2.537-9.877c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.535-5.558-3.813-5.93-2.868 1.35-4.75 4.032-5.164 7.178zM12.95 2.358c.26.32 2.152 2.84 3.837 5.924 3.636-1.517 5.07-3.92 5.23-4.164-1.765-1.566-4.08-2.52-6.623-2.52-.715 0-1.41.075-2.084.215-.043.045-.24.262-.36.545z',
    },
] as const;

function SocialSvg({ path }: Readonly<{ path: string }>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d={path} />
        </svg>
    );
}

export default function OrganismFrontofficeFooter() {
    return (
        <Div role="contentinfo" className="w-full bg-gray-900 text-white">
            <Div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
                <Div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
                    {/* Brand */}
                    <Div className="sm:col-span-2 lg:col-span-1 lg:max-w-xs">
                        <Link href="/" className="mb-4 inline-flex items-center gap-2">
                            <Div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-400">
                                <Label
                                    variant={EVariantLabel.bodyLarge}
                                    fontFamily={EFontFamily.Display}
                                    color="text-white"
                                    className="font-bold"
                                >
                                    N
                                </Label>
                            </Div>
                            <Label
                                variant={EVariantLabel.h5}
                                fontFamily={EFontFamily.Display}
                                color="text-white"
                                className="font-bold tracking-wide"
                            >
                                Nexera
                            </Label>
                        </Link>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-400" className="block leading-relaxed">
                            Top learning experiences that create more talent in the world.
                        </Label>
                    </Div>

                    {/* Product */}
                    <Div>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-400"
                            className="mb-4 block text-xs font-semibold uppercase tracking-wider"
                        >
                            Product
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {productLinks.map(({ href, label }) => (
                                <li key={`${href}-${label}`}>
                                    <Link href={href} className="group transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="font-medium group-hover:text-warning-400"
                                        >
                                            {label}
                                        </Label>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    {/* Company */}
                    <Div>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-400"
                            className="mb-4 block text-xs font-semibold uppercase tracking-wider"
                        >
                            Company
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {companyLinks.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="group inline-flex items-center gap-2 transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="font-medium group-hover:text-warning-400"
                                        >
                                            {item.label}
                                        </Label>
                                        {'badge' in item && item.badge ? (
                                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                                                {item.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    {/* Social (column links) */}
                    <Div>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-400"
                            className="mb-4 block text-xs font-semibold uppercase tracking-wider"
                        >
                            Social
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {socialLinks.map(({ href, label }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group transition-colors"
                                    >
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="font-medium group-hover:text-warning-400"
                                        >
                                            {label}
                                        </Label>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    {/* Legal */}
                    <Div>
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-400"
                            className="mb-4 block text-xs font-semibold uppercase tracking-wider"
                        >
                            Legal
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {legalLinks.map(({ href, label }) => (
                                <li key={label}>
                                    <Link href={href} className="group transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="font-medium group-hover:text-warning-400"
                                        >
                                            {label}
                                        </Label>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>
                </Div>

                <Div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-gray-700 pt-8 sm:flex-row">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-400">
                        © {new Date().getFullYear()} Nexera. All rights reserved.
                    </Label>
                    <Div className="flex items-center gap-5 text-gray-400">
                        {footerSocialIcons.map(({ href, label, path }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className="text-gray-400 transition-colors hover:text-white"
                            >
                                <SocialSvg path={path} />
                            </a>
                        ))}
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

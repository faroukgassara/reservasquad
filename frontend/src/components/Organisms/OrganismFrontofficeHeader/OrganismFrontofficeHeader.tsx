'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { Div, Label } from '@/components/Atoms';
import { Button, Input } from '@/components/Molecules';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import NexeraLogo from '@/assets/images/nexera-logo.png';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/aboutus', label: 'About us' },
    { href: '/courses', label: 'Courses' },
    { href: '/contact', label: 'Contact us' },
    { href: '/faq', label: "FAQ's" },
];

export default function OrganismFrontofficeHeader() {
    const { data: session } = useSession();

    return (
        <Div
            role="banner"
            className="sticky top-0 z-50 w-full bg-white border-b border-gray-200"
        >
            <Div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    <Image
                        src={NexeraLogo}
                        alt="Nexera Logo"
                        height={50}
                        className="object-contain"
                        priority
                    />
                </Link>

                {/* Search + Explore */}
                <Div className="hidden sm:flex flex-1 max-w-md items-center gap-2">
                    <Input
                        id="header-search"
                        placeholder="Want to learn?"
                        leftIcon={IconComponentsEnum.search}
                        containerClassName="flex-1"
                        className="bg-gray-50 border-gray-200"
                    />
                    <Button
                        id="header-explore"
                        text="Explore"
                        type={EButtonType.gray}
                        size={EButtonSize.medium}
                        icon={{
                            name: IconComponentsEnum.chevronDown,
                            size: ESize.sm,
                            color: 'text-gray-700',
                        }}
                        iconPosition="right"
                        className="border border-gray-200"
                    />
                </Div>

                {/* Nav links */}
                <Div role="navigation" className="hidden md:flex items-center gap-8">
                    {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href} className="group transition-colors">
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-gray-900"
                                className="font-medium group-hover:text-primary-600"
                            >
                                {label}
                            </Label>
                        </Link>
                    ))}
                </Div>

                {/* Auth buttons */}
                <Div className="flex shrink-0 items-center gap-4">
                    {session ? (
                        <Link
                            href={Routes.Dashboard}
                            className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2.5 text-md font-medium text-white transition-colors hover:bg-primary-600"
                        >
                            <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-medium">
                                Dashboard
                            </Label>
                        </Link>
                    ) : (
                        <>
                            <Link href={Routes.Login} className="group transition-colors">
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-900"
                                    className="font-medium group-hover:text-primary-600"
                                >
                                    Sign in
                                </Label>
                            </Link>
                            <Link
                                href={Routes.Login}
                                className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2.5 text-md font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
                            >
                                <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-medium">
                                    Create free account
                                </Label>
                            </Link>
                        </>
                    )}
                </Div>
            </Div>
        </Div>
    );
}

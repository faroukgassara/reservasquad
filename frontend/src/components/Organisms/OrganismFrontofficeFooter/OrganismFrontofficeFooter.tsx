'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';
import Image from 'next/image';
import Icon from '@/components/Primitives/Icon/Icon';
import BiblioSquadLogo from '@/assets/images/bibliosquad-logo.png';
const productLinkKeys = ['overview', 'features', 'solutions', 'tutorials', 'pricing'] as const;

const companyLinkKeys = [
    { href: '/aboutus', key: 'aboutUs' as const },
    { href: '/contact', key: 'careers' as const },
    { href: '/faq', key: 'press' as const, badge: true },
    { href: '/blog', key: 'news' as const },
] as const;

const legalLinkKeys = [
    { href: '/faq', key: 'terms' as const },
    { href: '/faq', key: 'privacy' as const },
    { href: '/faq', key: 'cookies' as const },
    { href: '/contact', key: 'contact' as const },
] as const;

const socialLinks = [
    { href: 'https://twitter.com', label: 'Twitter' },
    { href: 'https://linkedin.com', label: 'LinkedIn' },
    { href: 'https://github.com', label: 'GitHub' },
    { href: 'https://dribbble.com', label: 'Dribbble' },
] as const;

export default function OrganismFrontofficeFooter() {
    const t = useTranslations('footer');
    const tCommon = useTranslations('common');
    return (
        <Div role="contentinfo" className="w-full bg-primary-900 text-white">
            <Div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
                <Div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
                    <Div className="sm:col-span-2 lg:col-span-1 lg:max-w-xs">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                                    <Image
                                        src={BiblioSquadLogo}
                                        alt={tCommon('brandLogoAlt')}
                                        height={40}
                                        className="h-8 w-auto object-contain sm:h-10"
                                        priority
                                    />
                                </Link>
                        <Label variant={EVariantLabel.bodySmall} color="text-primary-200" className="block">
                            {t('tagline')}
                        </Label>
                    </Div>

                    <Div>
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-primary-300"
                            className="mb-4 block uppercase"
                        >
                            {t('product')}
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {productLinkKeys.map((key) => (
                                <li key={key}>
                                    <Link href={Routes.Shop.index} className="group transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="group-hover:text-primary-200"
                                        >
                                            {t(`links.${key}`)}
                                        </Label>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    <Div>
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-primary-300"
                            className="mb-4 block uppercase"
                        >
                            {t('company')}
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {companyLinkKeys.map((item) => (
                                <li key={item.key}>
                                    <Link href={item.href} className="group inline-flex items-center gap-2 transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="group-hover:text-primary-200"
                                        >
                                            {t(`links.${item.key}`)}
                                        </Label>
                                        {'badge' in item && item.badge ? (
                                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                                                {t('newBadge')}
                                            </span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    <Div>
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-primary-300"
                            className="mb-4 block uppercase"
                        >
                            {t('social')}
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
                                            className="group-hover:text-primary-200"
                                        >
                                            {label}
                                        </Label>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Div>

                    <Div>
                        <Label
                            variant={EVariantLabel.overline}
                            color="text-primary-300"
                            className="mb-4 block uppercase"
                        >
                            {t('legal')}
                        </Label>
                        <ul className="flex flex-col gap-3">
                            {legalLinkKeys.map(({ href, key }) => (
                                <li key={key}>
                                    <Link href={href} className="group transition-colors">
                                        <Label
                                            variant={EVariantLabel.bodySmall}
                                            color="text-white"
                                            className="group-hover:text-primary-200"
                                        >
                                            {t(`links.${key}`)}
                                        </Label>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Div>
                </Div>

                <Div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-primary-800 pt-8 sm:flex-row">
                    <Label variant={EVariantLabel.bodySmall} color="text-primary-200">
                        © {new Date().getFullYear()} Biblio Squad. {t('copyright')}
                    </Label>
                    <Div className="flex items-center gap-5">
                        <Icon name={IconComponentsEnum.youtube} size={ESize.md} color="text-primary-200" className="transition-colors hover:text-white" />
                        <Icon name={IconComponentsEnum.instagram} size={ESize.md} color="text-primary-200" className="transition-colors hover:text-white" />
                        <Icon name={IconComponentsEnum.facebook} size={ESize.md} color="text-primary-200" className="transition-colors hover:text-white" />
                        <Icon name={IconComponentsEnum.xTwitter} size={ESize.md} color="text-primary-200" className="transition-colors hover:text-white" />
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

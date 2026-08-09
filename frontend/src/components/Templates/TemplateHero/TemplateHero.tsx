'use client';

import type { StaticImageData } from 'next/image';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';
import { useLocale, useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import LaserImage from '@/assets/images/hero/laser.jpg';
import GiftsImage from '@/assets/images/hero/gifts.jpg';
import VinylImage from '@/assets/images/hero/vinyl.jpg';
import PrintImage from '@/assets/images/hero/print.jpg';

const COPY_ENTRANCE = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
} as const;

const COPY_ENTRANCE_REDUCED = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0, transition: { duration: 0 } },
} as const;

const VISUAL_ENTRANCE = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
    },
} as const;

const VISUAL_ENTRANCE_REDUCED = {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0 } },
} as const;

const STAT_KEYS = ['clients', 'expertise', 'services'] as const;

const GALLERY_ITEMS = [
    { key: 'laser' as const, image: LaserImage, className: 'col-span-2' },
    { key: 'gifts' as const, image: GiftsImage, className: '' },
    { key: 'vinyl' as const, image: VinylImage, className: '' },
    { key: 'print' as const, image: PrintImage, className: 'col-span-2 lg:col-span-1' },
] as const;

function GalleryTile({
    image,
    label,
    className,
}: Readonly<{ image: StaticImageData; label: string; className?: string }>) {
    return (
        <div className={twMerge('relative min-h-0 overflow-hidden rounded-2xl lg:rounded-3xl', className)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={image.src}
                alt=""
                className="absolute inset-0 size-full object-cover object-center"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary-900/75 via-primary-900/10 to-transparent"
            />
            <Label
                variant={EVariantLabel.bodySmall}
                color="text-white"
                className="absolute bottom-2.5 start-2.5 z-10 lg:bottom-3.5 lg:start-3.5"
            >
                {label}
            </Label>
        </div>
    );
}

function SpiralWatermark() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 600 600"
            className="pointer-events-none absolute -start-24 top-1/2 size-[min(90vw,42rem)] -translate-y-1/2 text-primary-400/15"
        >
            <path
                d="M300 300c0-120 96-216 216-216M300 300c0-80 64-144 144-144M300 300c0-48 38-86 86-86M300 300c40 0 72 32 72 72M300 300c0 56-45 101-101 101M300 300c0 96-77 173-173 173M300 300c-140 0-252 112-252 252"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
            <circle cx="300" cy="300" r="8" fill="currentColor" opacity="0.35" />
        </svg>
    );
}

export default function TemplateHero() {
    const t = useTranslations('hero');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const reducedMotion = useReducedMotion();

    const copyVariants = reducedMotion ? COPY_ENTRANCE_REDUCED : COPY_ENTRANCE;
    const visualVariants = reducedMotion ? VISUAL_ENTRANCE_REDUCED : VISUAL_ENTRANCE;

    return (
        <LazyMotion features={domAnimation} strict>
            <section
                aria-labelledby="hero-heading"
                dir={isRtl ? 'rtl' : 'ltr'}
                className={twMerge(
                    'relative z-0 isolate flex flex-col overflow-hidden bg-primary-500 text-white',
                    'h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]',
                )}
            >
                <SpiralWatermark />

                <div className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14">
                        <m.div
                            className="relative z-10 flex min-h-0 min-w-0 flex-col justify-center"
                            initial="hidden"
                            animate="visible"
                            variants={copyVariants}
                        >
                            <div className="mb-3 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-gold-400/80 px-3 py-1 sm:mb-4 sm:px-3.5">
                                <span aria-hidden className="text-gold-400">
                                    ✦
                                </span>
                                <Label
                                    variant={EVariantLabel.hint}
                                    color="text-gold-400"
                                    className="uppercase tracking-[0.12em]"
                                >
                                    {t('badge')}
                                </Label>
                            </div>

                            <h1
                                id="hero-heading"
                                className="max-w-xl text-start font-(family-name:--font-playfair) text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem] xl:text-[3.15rem]"
                            >
                                {t('headline.line1')}
                                <br />
                                <span className="italic text-gold-400">{t('headline.highlight')}</span>
                                <br />
                                {t('headline.line2')}
                            </h1>

                            <p className="mt-3 max-w-lg text-start text-sm leading-relaxed text-primary-100 sm:mt-4 sm:text-base lg:line-clamp-3">
                                {t('subtitle')}
                            </p>

                            <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
                                <Link
                                    href={Routes.Shop.index}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gold-300 sm:w-auto sm:px-6"
                                >
                                    {t('primaryCta')}
                                    <span aria-hidden>→</span>
                                </Link>
                                <Link
                                    href={Routes.Contact}
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/70 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto sm:px-6"
                                >
                                    {t('secondaryCta')}
                                </Link>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 sm:mt-6 sm:flex sm:flex-wrap sm:items-start sm:gap-x-8 sm:pt-5">
                                {STAT_KEYS.map((key) => (
                                    <div key={key} className="min-w-0">
                                        <p
                                            className={twMerge(
                                                'font-(family-name:--font-playfair) text-lg font-bold sm:text-2xl',
                                                key === 'services' ? 'text-gold-400' : 'text-white',
                                            )}
                                        >
                                            {t(`stats.${key}.value`)}
                                        </p>
                                        <p className="mt-0.5 text-[0.65rem] leading-snug text-primary-200 sm:text-sm">
                                            {t(`stats.${key}.label`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </m.div>

                        <m.div
                            className="relative z-0 hidden min-h-0 w-full lg:mx-0 lg:block lg:h-full lg:max-h-full"
                            initial="hidden"
                            animate="visible"
                            variants={visualVariants}
                        >
                            <div className="grid h-full min-h-0 grid-cols-2 grid-rows-[1.15fr_1fr_1fr] gap-3 xl:gap-4">
                                {GALLERY_ITEMS.map((item) => (
                                    <GalleryTile
                                        key={item.key}
                                        image={item.image}
                                        label={t(`gallery.${item.key}`)}
                                        className={item.className}
                                    />
                                ))}
                            </div>
                        </m.div>
                    </div>
                </div>
            </section>
        </LazyMotion>
    );
}

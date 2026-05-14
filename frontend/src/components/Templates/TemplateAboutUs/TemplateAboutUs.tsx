'use client';

import { Div, Label, Icon } from '@/components/Atoms';
import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { EFontFamily, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

const IMG_FEATURES =
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=85';

const BENEFIT_CARDS = [
    {
        n: '01',
        title: 'Standardization',
        desc: 'Clear curricula and structured modules so every learner follows a proven path from fundamentals to advanced practice.',
    },
    {
        n: '02',
        title: 'Reduced Costs',
        desc: 'Quality training without unnecessary overhead—focused materials and online-friendly formats that respect your budget.',
    },
    {
        n: '03',
        title: 'More Customization',
        desc: 'Adapt pacing and focus areas to your goals, whether you are upskilling, switching careers, or deepening UX craft.',
    },
    {
        n: '04',
        title: 'Affordable Pricing',
        desc: 'Transparent, accessible pricing tiers designed to lower the barrier to professional UI/UX education.',
    },
    {
        n: '05',
        title: 'Learner Satisfaction',
        desc: 'Feedback-driven improvements, mentor support, and project-based challenges that keep motivation high.',
    },
    {
        n: '06',
        title: 'Multimedia Materials',
        desc: 'Video lessons, readings, templates, and exercises so different learning styles stay engaged end to end.',
    },
] as const;

export default function TemplateAboutUs() {
    return (
        <Div className="bg-white">
            {/* —— Features —- */}
            <Div role="region" aria-labelledby="about-features-heading" className="border-b border-gray-100 bg-white">
                <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
                    <Div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <Div className="order-2 lg:order-1">
                            <Div className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm ring-1 ring-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={IMG_FEATURES}
                                    alt=""
                                    className="h-full max-h-[560px] w-full object-cover lg:aspect-3/4 lg:max-h-none"
                                />
                            </Div>
                        </Div>

                        <Div className="order-1 max-w-xl lg:order-2 lg:max-w-none">
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-success-600"
                                className="mb-3 block font-semibold uppercase tracking-wide"
                            >
                                Features
                            </Label>
                            <Div id="about-features-heading">
                                <Label
                                    variant={EVariantLabel.h2}
                                    fontFamily={EFontFamily.Sans}
                                    color="text-gray-900"
                                    className="block text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-snug"
                                >
                                    We are always working to provide you best of the features in all aspects.
                                </Label>
                            </Div>
                            <Label
                                variant={EVariantLabel.bodyLarge}
                                color="text-gray-600"
                                className="mt-6 block leading-relaxed"
                            >
                                At Nexera, we focus on clearing confusion and building real understanding—so you are not
                                just consuming content online, but learning how to think and ship like a designer.
                            </Label>
                            <Label
                                variant={EVariantLabel.bodyLarge}
                                color="text-gray-600"
                                className="mt-4 block leading-relaxed"
                            >
                                Knowledge matters more than access alone. Our programs combine mentoring, practice, and
                                critique so you gain confidence in research, UI craft, and UX decision-making.
                            </Label>
                            <Div className="mt-8">
                                <Link
                                    href={Routes.Login}
                                    id="about-features-learn-more"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-success-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-success-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-600"
                                >
                                    <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-semibold">
                                        Learn More
                                    </Label>
                                    <Icon name={IconComponentsEnum.arrowRight} size="w-5 h-5" color="text-white" />
                                </Link>
                            </Div>
                        </Div>
                    </Div>
                </Div>
            </Div>

            {/* —— Our Benefits —- */}
            <Div role="region" aria-labelledby="about-benefits-heading" className="bg-gray-50">
                <Div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
                    <Div className="mx-auto max-w-3xl text-center">
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-success-600"
                            className="mb-3 block font-semibold uppercase tracking-wide"
                        >
                            Our Benefits
                        </Label>
                        <Div id="about-benefits-heading">
                            <Label
                                variant={EVariantLabel.h2}
                                fontFamily={EFontFamily.Sans}
                                color="text-gray-900"
                                className="block text-3xl font-bold leading-tight sm:text-4xl"
                            >
                                By Joining Nexera Platform, One Can Avail a Lot Of Benefits.
                            </Label>
                        </Div>
                        <Label
                            variant={EVariantLabel.bodyLarge}
                            color="text-gray-600"
                            className="mx-auto mt-4 block max-w-2xl leading-relaxed"
                        >
                            Access a curated ecosystem of courses, projects, and peer learning—built to help you grow
                            faster with guidance from practitioners who ship real products.
                        </Label>
                    </Div>

                    <Div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
                        {BENEFIT_CARDS.map((card) => (
                            <Div
                                key={card.n}
                                className="flex flex-col rounded-2xl bg-success-25 p-6 shadow-sm ring-1 ring-success-100/80 sm:p-8"
                            >
                                <Label
                                    variant={EVariantLabel.h5}
                                    color="text-success-600"
                                    className="mb-4 block font-bold tabular-nums"
                                >
                                    {card.n}
                                </Label>
                                <Label
                                    variant={EVariantLabel.h5}
                                    fontFamily={EFontFamily.Sans}
                                    color="text-gray-900"
                                    className="mb-3 block font-bold"
                                >
                                    {card.title}
                                </Label>
                                <Label
                                    variant={EVariantLabel.bodySmall}
                                    color="text-gray-600"
                                    className="mb-4 block flex-1 leading-relaxed"
                                >
                                    {card.desc}
                                </Label>
                                <Link
                                    href={Routes.Login}
                                    className="group mt-auto inline-flex items-center gap-1 self-start"
                                    id={`about-benefit-read-${card.n}`}
                                >
                                    <Label
                                        variant={EVariantLabel.bodySmall}
                                        color="text-success-600"
                                        className="font-semibold group-hover:text-success-700"
                                    >
                                        Read More
                                    </Label>
                                    <Icon
                                        name={IconComponentsEnum.arrowRight}
                                        size="w-4 h-4"
                                        color="text-success-600"
                                        className="transition-transform group-hover:translate-x-0.5"
                                    />
                                </Link>
                            </Div>
                        ))}
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

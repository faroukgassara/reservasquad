'use client';

import { Link } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { Div, Icon, Label } from '@/components/Atoms';
import { EFontFamily, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

const features = [
    { icon: IconComponentsEnum.user, label: 'Public Speaking', color: 'text-warning-500' as const },
    { icon: IconComponentsEnum.layers, label: 'Career-Oriented', color: 'text-warning-600' as const },
    { icon: IconComponentsEnum.bookOpenText, label: 'Creative Thinking', color: 'text-danger-500' as const },
];

export default function TemplateHero() {
    return (
        <Div role="region" className="relative overflow-hidden bg-white">
            <Div className="absolute inset-0 -z-10">
                <Div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
                <Div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-50/60 blur-2xl" />
                <Div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-primary-50/30 blur-3xl" />
            </Div>

            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                <Div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <Div className="max-w-xl">
                        <Div className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            <Label variant={EVariantLabel.h1} fontFamily={EFontFamily.Sans} color="text-gray-900" className="inline">
                                Up Your{' '}
                            </Label>
                            <Label variant={EVariantLabel.h1} fontFamily={EFontFamily.Sans} color="text-primary-500" className="inline">
                                Skills
                            </Label>
                            <Label variant={EVariantLabel.h1} fontFamily={EFontFamily.Sans} color="text-gray-900" className="inline">
                                {' '}To Advance Your{' '}
                            </Label>
                            <Label variant={EVariantLabel.h1} fontFamily={EFontFamily.Sans} color="text-primary-500" className="inline">
                                Career Path
                            </Label>
                        </Div>
                        <Label
                            variant={EVariantLabel.bodyLarge}
                            color="text-gray-600"
                            className="mt-6 block"
                        >
                            Learn UI-UX Design skills with Nexera. The latest online learning system and material that help your knowledge growing.
                        </Label>

                        <Div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href={Routes.Login}
                                className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
                            >
                                <Label variant={EVariantLabel.bodySmall} color="text-white" className="font-medium">
                                    Get Started
                                </Label>
                            </Link>
                            <Link
                                href={Routes.Login}
                                className="inline-flex items-center justify-center rounded-lg border-2 border-primary-400 bg-primary-50 px-6 py-3 text-base font-medium transition-colors hover:bg-primary-100"
                            >
                                <Label variant={EVariantLabel.bodySmall} color="text-primary-700" className="font-medium">
                                    Get free trial
                                </Label>
                            </Link>
                        </Div>

                        <Div className="mt-10 flex flex-wrap gap-6">
                            {features.map(({ icon, label, color }) => (
                                <Div key={label} className="flex items-center gap-2">
                                    <Icon name={icon} size="w-5 h-5" color={color} />
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                                        {label}
                                    </Label>
                                </Div>
                            ))}
                        </Div>
                    </Div>

                    <Div className="relative">
                        <Div className="relative aspect-4/5 max-h-[500px] overflow-hidden rounded-2xl">
                            <Div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-100 to-primary-200">
                                <Div className="flex flex-col items-center gap-4">
                                    <Div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80">
                                        <Icon name={IconComponentsEnum.bookOpenText} size="w-12 h-12" color="text-primary-700" />
                                    </Div>
                                    <Label variant={EVariantLabel.bodySmall} color="text-primary-700" className="font-medium">
                                        Learning platform
                                    </Label>
                                </Div>
                            </Div>
                            <Div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border-4 border-primary-300/50" />
                            <Div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-primary-200/60" />
                        </Div>

                        <Div className="absolute -right-4 top-8 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                            <Div className="flex items-center gap-3">
                                <Div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                    <Icon name={IconComponentsEnum.check} size="w-5 h-5" color="text-primary-500" />
                                </Div>
                                <Div>
                                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-900" className="font-bold">
                                        5K+
                                    </Label>
                                    <Label variant={EVariantLabel.hint} color="text-gray-500" className="block">
                                        Online Courses
                                    </Label>
                                </Div>
                            </Div>
                        </Div>
                        <Div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                            <Div className="flex items-center gap-3">
                                <Div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                    <Icon name={IconComponentsEnum.video} size="w-5 h-5" color="text-primary-500" />
                                </Div>
                                <Div>
                                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-900" className="font-bold">
                                        2K+
                                    </Label>
                                    <Label variant={EVariantLabel.hint} color="text-gray-500" className="block">
                                        Video Courses
                                    </Label>
                                </Div>
                            </Div>
                        </Div>
                        <Div className="absolute -bottom-2 right-8 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                            <Div className="flex items-center gap-3">
                                <Div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                    <Icon name={IconComponentsEnum.user} size="w-5 h-5" color="text-primary-500" />
                                </Div>
                                <Div>
                                    <Label variant={EVariantLabel.hint} color="text-gray-500" className="block">
                                        Tutors
                                    </Label>
                                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-900" className="font-bold">
                                        250+
                                    </Label>
                                </Div>
                            </Div>
                        </Div>
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

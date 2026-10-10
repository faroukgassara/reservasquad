'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from '@/lib/routes';

interface IOrganismPosBillingTabs {
    active: 'quotations' | 'invoices';
}

export default function OrganismPosBillingTabs({ active }: Readonly<IOrganismPosBillingTabs>) {
    const t = useTranslations('pos.billing');

    const tabs = [
        { key: 'quotations', href: Routes.Pos.sales, icon: IconComponentsEnum.filetext, label: t('quotations') },
        { key: 'invoices', href: Routes.Pos.invoices, icon: IconComponentsEnum.layers, label: t('invoices') },
    ] as const;

    return (
        <nav className="flex w-full items-center gap-1 rounded-xl bg-gray-100 p-1 sm:inline-flex sm:w-auto">
            {tabs.map((tab) => {
                const selected = tab.key === active;
                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        aria-current={selected ? 'page' : undefined}
                        className={twMerge(
                            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 transition-colors hover:bg-white/70 sm:min-h-0 sm:flex-none',
                            selected && 'bg-white shadow-sm hover:bg-white',
                        )}
                    >
                        <Icon
                            name={tab.icon}
                            size={ESize.sm}
                            color={selected ? 'text-primary-500' : 'text-gray-500'}
                        />
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color={selected ? 'text-gray-900' : 'text-gray-600'}
                            className={selected ? 'font-semibold' : 'font-medium'}
                        >
                            {tab.label}
                        </Label>
                    </Link>
                );
            })}
        </nav>
    );
}

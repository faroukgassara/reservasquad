'use client';

import { useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Skeleton from '@/components/Primitives/Skeleton/Skeleton';
import { formatMoney, type DailyIncomeSummary as IDailyIncomeSummary } from '@/lib/daily-income-api';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

interface IEnvelope {
    key: string;
    name: string;
    swatch: string;
    allocated: number;
    available: number;
    outflows: { key: string; label: string; amount: number }[];
}

const round = (value: number) => Math.round(value * 100) / 100;

function EnvelopeCard({
    envelope,
    totalIncome,
    isLoading,
}: Readonly<{ envelope: IEnvelope; totalIncome: number; isLoading: boolean }>) {
    const t = useTranslations('admin.dailyIncome.summary');
    const share = totalIncome > 0 ? Math.round((envelope.allocated / totalIncome) * 100) : 0;
    const remainingRatio =
        envelope.allocated > 0 ? Math.min(100, Math.max(0, (envelope.available / envelope.allocated) * 100)) : 0;
    const isOverspent = envelope.available < 0;

    return (
        <Div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4">
            <Div className="flex items-center justify-between gap-2">
                <Div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${envelope.swatch}`} />
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate font-semibold!">
                        {envelope.name}
                    </Label>
                </Div>
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="shrink-0 tabular-nums">
                    {t('ofIncome', { value: share })}
                </Label>
            </Div>

            <Div className="mt-3 flex flex-col">
                <Label variant={EVariantLabel.caption} color="text-gray-500">
                    {t('available')}
                </Label>
                {isLoading ? (
                    <Skeleton className="mt-1 h-6 w-24" />
                ) : (
                    <Label
                        variant={EVariantLabel.h5}
                        color={isOverspent ? 'text-danger-600' : 'text-gray-900'}
                        className="font-bold! tabular-nums"
                    >
                        {formatMoney(envelope.available)}
                    </Label>
                )}
            </Div>

            <Div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <Div
                    className={`h-full rounded-full transition-all duration-500 ${envelope.swatch}`}
                    style={{ width: `${isLoading ? 0 : remainingRatio}%` }}
                />
            </Div>

            <Div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
                <Div className="flex items-center justify-between gap-2">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('allocated')}
                    </Label>
                    {isLoading ? (
                        <Skeleton className="h-3.5 w-16" />
                    ) : (
                        <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-medium tabular-nums">
                            {formatMoney(envelope.allocated)}
                        </Label>
                    )}
                </Div>
                {envelope.outflows.length === 0 ? (
                    <Label variant={EVariantLabel.caption} color="text-gray-400">
                        {t('noOutflows')}
                    </Label>
                ) : (
                    envelope.outflows.map((outflow) => (
                        <Div key={outflow.key} className="flex items-center justify-between gap-2">
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {outflow.label}
                            </Label>
                            {isLoading ? (
                                <Skeleton className="h-3.5 w-14" />
                            ) : (
                                <Label
                                    variant={EVariantLabel.caption}
                                    color={outflow.amount > 0 ? 'text-danger-600' : 'text-gray-400'}
                                    className="font-medium tabular-nums"
                                >
                                    {`−${formatMoney(outflow.amount)}`}
                                </Label>
                            )}
                        </Div>
                    ))
                )}
            </Div>
        </Div>
    );
}

export default function DailyIncomeSummary({
    summary,
    isLoading,
    showPreviousMonthRest,
    onEditPreviousMonthRest,
}: Readonly<{
    summary?: IDailyIncomeSummary;
    isLoading: boolean;
    showPreviousMonthRest: boolean;
    onEditPreviousMonthRest: () => void;
}>) {
    const t = useTranslations('admin.dailyIncome');

    const totalIncome = summary?.totalIncome ?? 0;
    const netBalance = summary?.netBalance ?? 0;
    const charges = summary?.totalCharges ?? 0;
    const investments = summary?.totalInvestments ?? 0;
    const farouk = summary?.totalFarouk ?? 0;
    const majdi = summary?.totalMajdi ?? 0;
    const ecofactureExpenses = summary?.totalEcofactureExpenses ?? 0;
    const benefitsAvailable = summary?.totalBenefits ?? 0;
    const ecofactureAvailable = summary?.totalSavingsForCharges ?? 0;
    const savings = summary?.totalSavings ?? 0;

    const envelopes: IEnvelope[] = [
        {
            key: 'charges',
            name: t('chargesInvestment'),
            swatch: 'bg-primary-500',
            allocated: round(netBalance + charges + investments),
            available: netBalance,
            outflows: [
                { key: 'charges', label: t('charge'), amount: charges },
                { key: 'investments', label: t('investment'), amount: investments },
            ],
        },
        {
            key: 'benefits',
            name: t('benefits'),
            swatch: 'bg-accent-500',
            allocated: round(benefitsAvailable + farouk + majdi),
            available: benefitsAvailable,
            outflows: [
                { key: 'farouk', label: t('farouk'), amount: farouk },
                { key: 'majdi', label: t('majdi'), amount: majdi },
            ],
        },
        {
            key: 'ecofacture',
            name: t('savingsForCharges'),
            swatch: 'bg-gray-400',
            allocated: round(ecofactureAvailable + ecofactureExpenses),
            available: ecofactureAvailable,
            outflows: [{ key: 'ecofacture', label: t('summary.expenses'), amount: ecofactureExpenses }],
        },
        {
            key: 'savings',
            name: t('savings'),
            swatch: 'bg-success-500',
            allocated: savings,
            available: savings,
            outflows: [],
        },
    ];

    return (
        <Div className="flex flex-col gap-3">
            <Div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 lg:flex-row lg:items-center lg:gap-8">
                <Div className="flex min-w-0 flex-col gap-1 lg:w-64 lg:shrink-0">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('totalIncome')}
                    </Label>
                    {isLoading ? (
                        <Skeleton className="mt-1 h-8 w-36" />
                    ) : (
                        <Label variant={EVariantLabel.h3} color="text-gray-900" className="font-bold! tabular-nums">
                            {formatMoney(totalIncome)}
                        </Label>
                    )}
                    {showPreviousMonthRest ? (
                        <Div className="flex items-center gap-1.5">
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                {t('previousMonthRest')} :
                            </Label>
                            {isLoading ? (
                                <Skeleton className="h-3.5 w-16" />
                            ) : (
                                <Label variant={EVariantLabel.caption} color="text-gray-900" className="font-medium tabular-nums">
                                    {formatMoney(summary?.previousMonthRest ?? 0)}
                                </Label>
                            )}
                            <Icon
                                name={IconComponentsEnum.edit}
                                size={ESize.xs}
                                color="text-gray-500"
                                className="cursor-pointer hover:text-primary-500"
                                handleClick={onEditPreviousMonthRest}
                            />
                        </Div>
                    ) : null}
                </Div>

                <Div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('summary.distribution')}
                    </Label>
                    <Div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100">
                        {!isLoading && totalIncome > 0
                            ? envelopes.map((envelope) => {
                                  const width = Math.max(0, (envelope.allocated / totalIncome) * 100);
                                  if (width === 0) return null;
                                  return (
                                      <Div
                                          key={envelope.key}
                                          className={`${envelope.swatch} transition-all duration-500`}
                                          style={{ width: `${width}%` }}
                                      />
                                  );
                              })
                            : null}
                    </Div>
                    <Div className="flex flex-wrap gap-x-4 gap-y-1">
                        {envelopes.map((envelope) => (
                            <Div key={envelope.key} className="flex items-center gap-1.5">
                                <span aria-hidden className={`size-2 rounded-full ${envelope.swatch}`} />
                                <Label variant={EVariantLabel.caption} color="text-gray-600">
                                    {envelope.name}
                                </Label>
                            </Div>
                        ))}
                    </Div>
                </Div>

                <Div className="flex min-w-0 flex-col gap-1 border-t border-gray-100 pt-4 lg:w-56 lg:shrink-0 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('netBalance')}
                    </Label>
                    {isLoading ? (
                        <Skeleton className="mt-1 h-8 w-32" />
                    ) : (
                        <Label
                            variant={EVariantLabel.h3}
                            color={netBalance < 0 ? 'text-danger-600' : 'text-success-700'}
                            className="font-bold! tabular-nums"
                        >
                            {formatMoney(netBalance)}
                        </Label>
                    )}
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('summary.netBalanceHint')}
                    </Label>
                </Div>
            </Div>

            <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {envelopes.map((envelope) => (
                    <EnvelopeCard
                        key={envelope.key}
                        envelope={envelope}
                        totalIncome={totalIncome}
                        isLoading={isLoading}
                    />
                ))}
            </Div>
        </Div>
    );
}

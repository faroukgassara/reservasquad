'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Badge from '@/components/Primitives/Badge/Badge'
import Button from '@/components/Primitives/Button/Button'
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField'
import Div from '@/components/Primitives/Div/Div'
import Icon from '@/components/Primitives/Icon/Icon'
import Label from '@/components/Primitives/Label/Label'
import StatCard from '@/components/Primitives/StatCard/StatCard'
import Tabs from '@/components/Primitives/Tabs/Tabs'
import { SingleProductSalesChart } from '@/components/Organisms/Pos/ProductSalesCharts'
import { formatMoney } from '@/lib/daily-income-api'
import {
  fetchPosCatalogStats,
  fetchPosProductStats,
  formatPosDate,
  type PosProduct,
  type PosStatsRange,
} from '@/lib/pos-api'
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum'

type StatsRangeMode = 'all' | 'custom'

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Div className="flex items-center justify-between gap-3 py-2.5">
      <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
        {label}
      </Label>
      <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold tabular-nums">
        {value}
      </Label>
    </Div>
  )
}

export default function PosProductStats({
  product,
  categoryId,
}: Readonly<{ product?: PosProduct; categoryId?: string }>) {
  const t = useTranslations('pos.products')
  const tCommon = useTranslations('common')
  const [mode, setMode] = useState<StatsRangeMode>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedRange, setAppliedRange] = useState<PosStatsRange>({})

  const range: PosStatsRange = mode === 'custom' ? appliedRange : {}

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos-product-stats', product?.id ?? 'all', categoryId ?? 'all', range.startDate, range.endDate],
    queryFn: () =>
      product ? fetchPosProductStats(product.id, range) : fetchPosCatalogStats(range, categoryId),
  })

  const sales = data?.sales
  const hasSales = !!sales && sales.revenue !== 0
  const costUnknown = hasSales && sales.margin === null
  const partialCost =
    hasSales && sales.margin !== null && sales.costCoveragePct !== null && sales.costCoveragePct < 100
  const notSet = t('statsNotSet')
  const money = (value: number | null | undefined) =>
    value === null || value === undefined ? notSet : formatMoney(value)

  const trendData = (data?.trend ?? []).map((point) => ({
    month: point.key,
    label: point.label,
    unitsSold: point.unitsSold,
    totalRevenue: point.revenue,
    ordersCount: 0,
    margin: point.margin,
  }))
  const showMarginLine = trendData.some((point) => point.margin !== null)

  return (
    <Div className="space-y-4">
      <Div className="flex flex-col gap-3">
        <Div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            variant="pills"
            options={[
              { value: 'all', label: t('statsPeriodAll') },
              { value: 'custom', label: t('statsPeriodCustom') },
            ]}
            value={mode}
            onChange={(value) => {
              if (value === 'all' || value === 'custom') setMode(value)
            }}
            className="w-full sm:w-auto"
          />
          <Label variant={EVariantLabel.caption} color="text-gray-500">
            {t('statsScope')}
          </Label>
        </Div>
        {mode === 'custom' ? (
          <Div className="flex flex-wrap items-end gap-3">
            <Div className="w-44 sm:w-52">
              <DatePickerField
                id="pos-product-stats-start"
                label={t('statsStartDate')}
                value={customStart}
                max={customEnd || undefined}
                onChange={(value) => setCustomStart(value)}
              />
            </Div>
            <Div className="w-44 sm:w-52">
              <DatePickerField
                id="pos-product-stats-end"
                label={t('statsEndDate')}
                value={customEnd}
                min={customStart || undefined}
                onChange={(value) => setCustomEnd(value)}
              />
            </Div>
            <Button
              id="pos-product-stats-apply"
              text={t('statsApplyRange')}
              size={EButtonSize.medium}
              type={EButtonType.primary}
              onClick={() =>
                setAppliedRange({
                  startDate: customStart || undefined,
                  endDate: customEnd || undefined,
                })
              }
            />
          </Div>
        ) : null}
      </Div>

      {error ? (
        <Label variant={EVariantLabel.bodySmall} color="text-danger-600">
          {error instanceof Error ? error.message : tCommon('error')}
        </Label>
      ) : null}

      <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IconComponentsEnum.shoppingCart}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
          label={t('statsUnitsSold')}
          value={t('units', { count: sales?.unitsSold ?? 0 })}
          isLoading={isLoading}
          action={
            sales && sales.ordersCount > 0 ? (
              <Badge
                id="pos-product-stats-orders"
                text={t('statsOrders', { count: sales.ordersCount })}
                type={EBadgeType.primary}
                size={EBadgeSize.tiny}
              />
            ) : undefined
          }
        />
        <StatCard
          icon={IconComponentsEnum.layers}
          iconBg="bg-accent-50"
          iconColor="text-accent-600"
          label={t('statsRevenue')}
          value={formatMoney(sales?.revenue ?? 0)}
          isLoading={isLoading}
        />
        <StatCard
          icon={IconComponentsEnum.filetext}
          iconBg="bg-warning-50"
          iconColor="text-warning-700"
          label={t('statsTotalCost')}
          value={
            sales?.margin === null || sales?.margin === undefined
              ? '—'
              : formatMoney(sales.costOfSales)
          }
          isLoading={isLoading}
        />
        <StatCard
          icon={IconComponentsEnum.star}
          iconBg="bg-success-50"
          iconColor="text-success-700"
          label={t('statsMargin')}
          value={sales?.margin === null || sales?.margin === undefined ? t('statsMarginUnknown') : formatMoney(sales.margin)}
          isLoading={isLoading}
          action={
            sales?.marginPct !== null && sales?.marginPct !== undefined ? (
              <Badge
                id="pos-product-stats-margin-pct"
                text={`${sales.marginPct}%`}
                type={sales.marginPct < 0 ? EBadgeType.error : EBadgeType.success}
                size={EBadgeSize.tiny}
              />
            ) : undefined
          }
        />
      </Div>

      {costUnknown || partialCost ? (
        <Div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            costUnknown ? 'border-warning-200 bg-warning-50' : 'border-primary-100 bg-primary-25'
          }`}
        >
          <Icon
            name={IconComponentsEnum.info}
            size={ESize.sm}
            color={costUnknown ? 'text-warning-700' : 'text-primary-600'}
            className="mt-0.5 shrink-0"
          />
          <Label variant={EVariantLabel.bodySmall} color={costUnknown ? 'text-warning-700' : 'text-primary-700'}>
            {costUnknown
              ? t('statsNoCost')
              : t('statsCoverage', { pct: Math.round(sales?.costCoveragePct ?? 0) })}
          </Label>
        </Div>
      ) : null}

      <Div className="grid items-start gap-4 lg:grid-cols-3">
        <Div className="space-y-3 rounded-xl border border-gray-100 p-4 sm:p-5 lg:col-span-2">
          <Label variant={EVariantLabel.subtitle} color="text-gray-900">
            {data?.granularity === 'session' ? t('statsTrendSessions') : t('statsTrendMonths')}
          </Label>
          {isLoading ? (
            <Div aria-hidden="true" className="h-56 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <SingleProductSalesChart
              data={trendData}
              productName={product?.name ?? t('allProducts')}
              revenueLabel={t('statsRevenue')}
              unitsLabel={t('statsUnitsSold')}
              marginLabel={showMarginLine ? t('statsMargin') : undefined}
            />
          )}
        </Div>

        <Div className="space-y-1 rounded-xl border border-gray-100 p-4 sm:p-5">
          <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="mb-1 block">
            {t('statsCostAndStock')}
          </Label>
          <Div className="divide-y divide-gray-100">
            {product ? (
              <>
                <InfoRow label={t('statsCurrentCost')} value={money(data?.stock.currentCost)} />
                <InfoRow
                  label={t('statsLastPurchaseCost')}
                  value={
                    data?.purchases.lastPurchaseCost !== null && data?.purchases.lastPurchaseCost !== undefined
                      ? `${formatMoney(data.purchases.lastPurchaseCost)}${
                          data.purchases.lastPurchaseAt ? ` · ${formatPosDate(data.purchases.lastPurchaseAt)}` : ''
                        }`
                      : notSet
                  }
                />
              </>
            ) : null}
            <InfoRow label={t('statsAvgPurchaseCost')} value={money(data?.purchases.avgPurchaseCost)} />
            <InfoRow label={t('statsSoldAllTime')} value={t('units', { count: data?.stock.sold ?? 0 })} />
            <InfoRow label={t('statsInStock')} value={t('units', { count: data?.stock.stock ?? 0 })} />
          </Div>
        </Div>
      </Div>
    </Div>
  )
}

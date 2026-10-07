'use client'

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Badge from '@/components/Primitives/Badge/Badge'
import Button from '@/components/Primitives/Button/Button'
import Div from '@/components/Primitives/Div/Div'
import Dropdown from '@/components/Primitives/Dropdown/Dropdown'
import ImageUpload from '@/components/Primitives/ImageUpload/ImageUpload'
import Input from '@/components/Primitives/Input/Input'
import Label from '@/components/Primitives/Label/Label'
import Tabs from '@/components/Primitives/Tabs/Tabs'
import Toggle from '@/components/Primitives/Toggle/Toggle'
import { useToast } from '@/contexts/ToastContext'
import { formatMoney } from '@/lib/daily-income-api'
import {
  createPosStockEntry,
  fetchPosProductStats,
  fetchPosStockEntries,
  formatPosDateTime,
  POS_TAX_RATES,
  toAmount,
  type PosCategory,
  type PosProduct,
  type PosProductType,
  type SubscriptionUnit,
} from '@/lib/pos-api'
import {
  EBadgeSize,
  EBadgeType,
  EButtonSize,
  EButtonType,
  EInputType,
  EToastType,
  EVariantLabel,
} from '@/Enum/Enum'

const NO_CATEGORY = '__none__'

export interface PosProductFormValues {
  name: string
  imageUrl: string
  type: PosProductType
  price: string
  cost: string
  categoryId: string
  reference: string
  barcode: string
  availableInPos: boolean
  taxRate: string
  isSubscription: boolean
  subscriptionDuration: string
}

const UNIT_DAYS: Record<SubscriptionUnit, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }

function subscriptionDays(product: PosProduct | null): number {
  if (!product?.subscriptionDuration || !product.subscriptionUnit) return 30
  return product.subscriptionDuration * UNIT_DAYS[product.subscriptionUnit]
}

interface IOrganismPosProductForm {
  product: PosProduct | null
  categories: PosCategory[]
  onSubmit: (values: PosProductFormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

type ProductTab = 'general' | 'sale' | 'purchase'

function parseAmount(value: string): number {
  return Number(value.replace(',', '.'))
}

function isValidAmount(value: string): boolean {
  const amount = parseAmount(value)
  return value.trim() !== '' && Number.isFinite(amount) && amount >= 0
}

function PosProductPurchases({ product }: Readonly<{ product: PosProduct }>) {
  const t = useTranslations('pos.products')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const { openToast } = useToast()

  const { data: stats } = useQuery({
    queryKey: ['pos-product-stats', product.id],
    queryFn: () => fetchPosProductStats(product.id),
  })
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['pos-stock-entries', product.id],
    queryFn: () => fetchPosStockEntries(product.id),
  })

  const addMutation = useMutation({
    mutationFn: (body: Parameters<typeof createPosStockEntry>[1]) =>
      createPosStockEntry(product.id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['pos-product-stats', product.id],
      })
      void queryClient.invalidateQueries({
        queryKey: ['pos-stock-entries', product.id],
      })
      void queryClient.invalidateQueries({ queryKey: ['pos-products'] })
      openToast(tCommon('success'), t('purchaseAdded'), {
        type: EToastType.SUCCESS,
      })
      form.reset()
    },
    onError: (error: Error) =>
      openToast(tCommon('error'), error.message, { type: EToastType.ERROR }),
  })

  const form = useForm({
    defaultValues: {
      quantity: '',
      unitCost: String(toAmount(product.cost)),
      supplier: '',
    },
    onSubmit: async ({ value }) => {
      await addMutation.mutateAsync({
        quantity: parseAmount(value.quantity),
        unitCost: parseAmount(value.unitCost) || 0,
        supplier: value.supplier.trim() || undefined,
      })
    },
  })

  const statItems = [
    {
      key: 'bought',
      label: t('bought'),
      value: stats?.bought,
      type: EBadgeType.primary,
    },
    {
      key: 'sold',
      label: t('sold'),
      value: stats?.sold,
      type: EBadgeType.success,
    },
    {
      key: 'remaining',
      label: t('remaining'),
      value: stats?.remaining,
      type: EBadgeType.warning,
    },
  ]

  return (
    <Div className="space-y-5">
      <Div className="grid grid-cols-3 gap-2">
        {statItems.map((item) => (
          <Div
            key={item.key}
            className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <Label variant={EVariantLabel.caption} color="text-gray-500">
              {item.label}
            </Label>
            <Badge
              id={`pos-product-stat-${item.key}`}
              text={
                item.value === undefined
                  ? '—'
                  : t('units', { count: item.value })
              }
              type={item.type}
              size={EBadgeSize.small}
            />
          </Div>
        ))}
      </Div>

      <Div className="space-y-3 rounded-xl border border-gray-100 p-4">
        <Label variant={EVariantLabel.subtitle} color="text-gray-900">
          {t('addPurchase')}
        </Label>
        <Div className="grid grid-cols-2 gap-3">
          <form.Field
            name="quantity"
            validators={{
              onSubmit: ({ value }) =>
                isValidAmount(value) && parseAmount(value) > 0
                  ? undefined
                  : t('invalidQuantity'),
            }}
          >
            {({ state, handleChange }) => (
              <Input
                id="pos-purchase-quantity"
                label={t('quantity')}
                value={state.value}
                type={EInputType.number}
                onChange={(e) => handleChange(e.target.value)}
                required
                hintText={
                  state.meta.errors?.[0]
                    ? String(state.meta.errors[0])
                    : undefined
                }
                error={!!state.meta.errors?.length}
              />
            )}
          </form.Field>
          <form.Field name="unitCost">
            {({ state, handleChange }) => (
              <Input
                id="pos-purchase-unit-cost"
                label={t('unitCost')}
                value={state.value}
                type={EInputType.number}
                onChange={(e) => handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </Div>
        <form.Field name="supplier">
          {({ state, handleChange }) => (
            <Input
              id="pos-purchase-supplier"
              label={t('supplier')}
              value={state.value}
              onChange={(e) => handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <Button
          id="pos-purchase-submit"
          type={EButtonType.secondary}
          size={EButtonSize.medium}
          text={t('addPurchase')}
          isLoading={addMutation.isPending}
          spinnerColor="text-primary-500"
          onClick={() => form.handleSubmit()}
          className="w-full"
        />
      </Div>

      <Div className="space-y-2">
        <Label variant={EVariantLabel.subtitle} color="text-gray-900">
          {t('purchaseHistory')}
        </Label>
        {!isLoading && entries.length === 0 ? (
          <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
            {t('noPurchases')}
          </Label>
        ) : null}
        {entries.map((entry) => (
          <Div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
          >
            <Div className="flex min-w-0 flex-col">
              <Label
                variant={EVariantLabel.bodySmall}
                color="text-gray-900"
                className="truncate"
              >
                {entry.supplier || t('noSupplier')}
              </Label>
              <Label variant={EVariantLabel.caption} color="text-gray-500">
                {formatPosDateTime(entry.createdAt)}
              </Label>
            </Div>
            <Div className="flex shrink-0 flex-col items-end">
              <Label
                variant={EVariantLabel.bodySmall}
                color="text-gray-900"
                className="font-semibold"
              >
                {t('units', { count: toAmount(entry.quantity) })}
              </Label>
              <Label variant={EVariantLabel.caption} color="text-gray-500">
                {formatMoney(toAmount(entry.unitCost))}
              </Label>
            </Div>
          </Div>
        ))}
      </Div>
    </Div>
  )
}

export default function OrganismPosProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}: Readonly<IOrganismPosProductForm>) {
  const t = useTranslations('pos.products')
  const tCommon = useTranslations('common')
  const [tab, setTab] = useState<ProductTab>('general')

  const form = useForm({
    defaultValues: {
      name: product?.name ?? '',
      imageUrl: product?.imageUrl ?? '',
      type: product?.type ?? 'CONSUMABLE',
      price: product ? String(toAmount(product.price)) : '',
      cost: product ? String(toAmount(product.cost)) : '0',
      categoryId: product?.categoryId ?? NO_CATEGORY,
      reference: product?.reference ?? '',
      barcode: product?.barcode ?? '',
      availableInPos: product?.availableInPos ?? true,
      taxRate: String(toAmount(product?.taxRate)),
      isSubscription: !!product?.subscriptionDuration,
      subscriptionDuration: String(subscriptionDays(product)),
    } as PosProductFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        categoryId: value.categoryId === NO_CATEGORY ? '' : value.categoryId,
      })
    },
  })

  const tabOptions = [
    { value: 'general', label: t('tabGeneral') },
    { value: 'sale', label: t('tabSale') },
    ...(product ? [{ value: 'purchase', label: t('tabPurchase') }] : []),
  ]

  const categoryOptions = [
    { value: NO_CATEGORY, label: t('noCategory') },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <form
      className="rounded-2xl border border-gray-100 bg-white shadow-sm"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <Div className="flex flex-col-reverse gap-5 border-b border-gray-100 p-5 sm:flex-row sm:items-start">
        <Div className="min-w-0 flex-1">
          <form.Field
            name="name"
            validators={{
              onSubmit: ({ value }) =>
                value.trim() ? undefined : t('nameRequired'),
            }}
          >
            {({ state, handleChange }) => (
              <Input
                id="pos-product-name"
                label={t('name')}
                value={state.value}
                onChange={(e) => handleChange(e.target.value)}
                required
                hintText={
                  state.meta.errors?.[0]
                    ? String(state.meta.errors[0])
                    : undefined
                }
                error={!!state.meta.errors?.length}
              />
            )}
          </form.Field>
        </Div>
        <Div className="w-full sm:w-56">
          <form.Field name="imageUrl">
            {({ state, handleChange }) => (
              <ImageUpload
                id="pos-product-image"
                label={t('image')}
                value={state.value}
                onChange={handleChange}
                onClear={() => handleChange('')}
              />
            )}
          </form.Field>
        </Div>
      </Div>

      <Div className="space-y-4 p-5">
        <Tabs
          variant="pills"
          options={tabOptions}
          value={tab}
          onChange={(value) => setTab(value as ProductTab)}
          className="w-full sm:w-auto"
        />

        <Div
          className={tab === 'general' ? 'grid gap-4 lg:grid-cols-2' : 'hidden'}
        >
          <form.Field name="type">
            {({ state, handleChange }) => (
              <Dropdown
                label={t('type')}
                options={[
                  { value: 'CONSUMABLE', label: t('typeConsumable') },
                  { value: 'STOCKABLE', label: t('typeStockable') },
                ]}
                value={state.value}
                onChange={(value) => {
                  if (value === 'CONSUMABLE' || value === 'STOCKABLE')
                    handleChange(value)
                }}
                hintText={t('typeHint')}
              />
            )}
          </form.Field>
          <Div className="grid grid-cols-2 gap-3">
            <form.Field
              name="price"
              validators={{
                onSubmit: ({ value }) =>
                  isValidAmount(value) ? undefined : t('invalidPrice'),
              }}
            >
              {({ state, handleChange }) => (
                <Input
                  id="pos-product-price"
                  label={t('price')}
                  value={state.value}
                  type={EInputType.number}
                  onChange={(e) => handleChange(e.target.value)}
                  required
                  hintText={
                    state.meta.errors?.[0]
                      ? String(state.meta.errors[0])
                      : undefined
                  }
                  error={!!state.meta.errors?.length}
                />
              )}
            </form.Field>
            <form.Field
              name="cost"
              validators={{
                onSubmit: ({ value }) =>
                  isValidAmount(value) ? undefined : t('invalidPrice'),
              }}
            >
              {({ state, handleChange }) => (
                <Input
                  id="pos-product-cost"
                  label={t('cost')}
                  value={state.value}
                  type={EInputType.number}
                  onChange={(e) => handleChange(e.target.value)}
                  hintText={
                    state.meta.errors?.[0]
                      ? String(state.meta.errors[0])
                      : undefined
                  }
                  error={!!state.meta.errors?.length}
                />
              )}
            </form.Field>
          </Div>
          <form.Field name="categoryId">
            {({ state, handleChange }) => (
              <Dropdown
                label={t('category')}
                options={categoryOptions}
                value={state.value}
                onChange={(value) => {
                  if (typeof value === 'string') handleChange(value)
                }}
              />
            )}
          </form.Field>
          <Div className="grid grid-cols-2 gap-3">
            <form.Field name="reference">
              {({ state, handleChange }) => (
                <Input
                  id="pos-product-reference"
                  label={t('reference')}
                  value={state.value}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </form.Field>
            <form.Field name="barcode">
              {({ state, handleChange }) => (
                <Input
                  id="pos-product-barcode"
                  label={t('barcode')}
                  value={state.value}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </Div>
        </Div>

        <Div className={tab === 'sale' ? 'max-w-xl space-y-4' : 'hidden'}>
          <form.Subscribe selector={(state) => state.values.isSubscription}>
            {(isSubscription) =>
              isSubscription ? null : (
                <form.Field name="availableInPos">
                  {({ state, handleChange }) => (
                    <Div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                      <Div className="flex flex-col">
                        <Label
                          variant={EVariantLabel.bodySmall}
                          color="text-gray-900"
                          className="font-medium"
                        >
                          {t('availableInPos')}
                        </Label>
                        <Label variant={EVariantLabel.caption} color="text-gray-500">
                          {t('availableInPosHint')}
                        </Label>
                      </Div>
                      <Toggle
                        id="pos-product-available"
                        checked={state.value}
                        onChange={handleChange}
                      />
                    </Div>
                  )}
                </form.Field>
              )
            }
          </form.Subscribe>
          <form.Field name="taxRate">
            {({ state, handleChange }) => (
              <Dropdown
                label={t('taxRate')}
                options={POS_TAX_RATES.map((rate) => ({
                  value: String(rate),
                  label: t('taxRateValue', { rate }),
                }))}
                value={state.value}
                onChange={(value) => handleChange(String(value))}
                hintText={t('taxRateHint')}
              />
            )}
          </form.Field>
          <Div className="space-y-4 rounded-xl border border-gray-100 p-4">
            <form.Field name="isSubscription">
              {({ state, handleChange }) => (
                <Div className="flex items-center justify-between gap-4">
                  <Div className="flex flex-col">
                    <Label
                      variant={EVariantLabel.bodySmall}
                      color="text-gray-900"
                      className="font-medium"
                    >
                      {t('isSubscription')}
                    </Label>
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                      {t('isSubscriptionHint')}
                    </Label>
                  </Div>
                  <Toggle
                    id="pos-product-subscription"
                    checked={state.value}
                    onChange={handleChange}
                  />
                </Div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.isSubscription}>
              {(isSubscription) =>
                isSubscription ? (
                  <form.Field
                    name="subscriptionDuration"
                    validators={{
                      onSubmit: ({ value, fieldApi }) => {
                        if (!fieldApi.form.getFieldValue('isSubscription')) return undefined
                        const duration = Number(value)
                        return Number.isInteger(duration) && duration >= 1 && duration <= 3650
                          ? undefined
                          : t('invalidDuration')
                      },
                    }}
                  >
                    {({ state, handleChange }) => (
                      <Input
                        id="pos-product-subscription-duration"
                        label={t('subscriptionDuration')}
                        value={state.value}
                        type={EInputType.intNumber}
                        onChange={(e) => handleChange(e.target.value)}
                        required
                        hintText={
                          state.meta.errors?.[0]
                            ? String(state.meta.errors[0])
                            : undefined
                        }
                        error={!!state.meta.errors?.length}
                      />
                    )}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>
          </Div>
        </Div>

        {product && tab === 'purchase' ? (
          <Div className="max-w-2xl">
            <PosProductPurchases product={product} />
          </Div>
        ) : null}
      </Div>

      <Div className="flex justify-end gap-3 border-t border-gray-100 p-5">
        <Button
          id="pos-product-cancel"
          type={EButtonType.secondary}
          size={EButtonSize.medium}
          text={tCommon('cancel')}
          onClick={onCancel}
        />
        <Button
          id="pos-product-submit"
          type={EButtonType.primary}
          size={EButtonSize.medium}
          text={tCommon('save')}
          isLoading={isLoading}
          onClick={() => {
            void form.handleSubmit().then(() => {
              if (form.state.isValid) return
              const generalInvalid = (['name', 'price', 'cost'] as const).some(
                (field) => form.getFieldMeta(field)?.errors?.length,
              )
              setTab(generalInvalid ? 'general' : 'sale')
            })
          }}
        />
      </Div>
    </form>
  )
}

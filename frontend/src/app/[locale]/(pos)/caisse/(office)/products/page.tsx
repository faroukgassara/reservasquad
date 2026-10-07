'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import LayoutWrapper from '@/components/Layouts/LayoutWrapper'
import PosThumbnail from '@/components/Organisms/Pos/PosThumbnail'
import Badge from '@/components/Primitives/Badge/Badge'
import Button from '@/components/Primitives/Button/Button'
import Div from '@/components/Primitives/Div/Div'
import Dropdown from '@/components/Primitives/Dropdown/Dropdown'
import Icon from '@/components/Primitives/Icon/Icon'
import Input from '@/components/Primitives/Input/Input'
import Label from '@/components/Primitives/Label/Label'
import Spinner from '@/components/Primitives/Spinner/Spinner'
import { formatMoney } from '@/lib/daily-income-api'
import { Routes } from '@/lib/routes'
import {
  fetchPosCategories,
  fetchPosProducts,
  toAmount,
  type PosProduct,
} from '@/lib/pos-api'
import {
  EBadgeSize,
  EBadgeType,
  EButtonSize,
  EButtonType,
  ESize,
  EVariantLabel,
  IconComponentsEnum,
} from '@/Enum/Enum'

type AvailabilityFilter = 'all' | 'available' | 'hidden'

const ALL = 'all'
const PER_PAGE = 30

function ProductCard({ product }: Readonly<{ product: PosProduct }>) {
  const t = useTranslations('pos.products')
  const stock = toAmount(product.stockQty)

  return (
    <Link
      href={Routes.Pos.product(product.id)}
      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-primary-200 hover:bg-gray-25"
    >
      <PosThumbnail
        imageUrl={product.imageUrl}
        alt={product.name}
        className="size-16 rounded-lg"
      />
      <Div className="flex min-w-0 flex-1 flex-col gap-1">
        <Label
          variant={EVariantLabel.bodySmall}
          color="text-gray-900"
          className="truncate font-semibold"
        >
          {product.name}
        </Label>
        <Label
          variant={EVariantLabel.caption}
          color="text-gray-600"
          className="tabular-nums"
        >
          {t('priceValue', { value: formatMoney(toAmount(product.price)) })}
        </Label>
        {product.type === 'STOCKABLE' || !product.availableInPos ? (
          <Div className="flex flex-wrap gap-1">
            {product.type === 'STOCKABLE' ? (
              <Badge
                id={`pos-product-stock-${product.id}`}
                text={t('units', { count: stock })}
                type={stock > 0 ? EBadgeType.success : EBadgeType.error}
                size={EBadgeSize.small}
              />
            ) : null}
            {product.availableInPos ? null : (
              <Badge
                id={`pos-product-hidden-${product.id}`}
                text={t('onlyHidden')}
                type={EBadgeType.warning}
                size={EBadgeSize.small}
              />
            )}
          </Div>
        ) : null}
      </Div>
    </Link>
  )
}

export default function PosProductsPage() {
  const t = useTranslations('pos.products')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL)
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: categories = [] } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: fetchPosCategories,
  })

  const { data, isLoading } = useQuery({
    queryKey: [
      'pos-products',
      page,
      debouncedSearch,
      categoryFilter,
      availability,
    ],
    queryFn: () =>
      fetchPosProducts({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter === ALL ? undefined : categoryFilter,
        availableInPos:
          availability === 'all' ? undefined : availability === 'available',
      }),
  })

  const products = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const lastPage = data?.meta?.lastPage ?? 1
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const to = Math.min(page * PER_PAGE, total)

  const categoryOptions = [
    { value: ALL, label: t('allCategories') },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const availabilityOptions = [
    { value: 'all', label: t('allProducts') },
    { value: 'available', label: t('onlyAvailable') },
    { value: 'hidden', label: t('onlyHidden') },
  ]

  return (
    <LayoutWrapper
      title={t('title')}
      subTitle={t('subtitle')}
      rightActions={
        <Button
          id="pos-product-add-btn"
          type={EButtonType.primary}
          size={EButtonSize.medium}
          iconPosition="left"
          icon={{
            name: IconComponentsEnum.plus,
            size: ESize.sm,
            color: 'text-white',
          }}
          text={t('create')}
          onClick={() => router.push(Routes.Pos.product('new'))}
        />
      }
      mainSection={
        <Div className="space-y-4">
          <Div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              id="pos-products-search"
              leftIcon="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerClassName="w-full lg:max-w-sm"
            />
            <Dropdown
              leftIcon="filter"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setCategoryFilter(value)
                  setPage(1)
                }
              }}
              containerClassName="w-full lg:w-56"
            />
            <Dropdown
              leftIcon="filter"
              options={availabilityOptions}
              value={availability}
              onChange={(value) => {
                if (
                  value === 'all' ||
                  value === 'available' ||
                  value === 'hidden'
                ) {
                  setAvailability(value)
                  setPage(1)
                }
              }}
              containerClassName="w-full lg:w-56"
            />
            <Div className="flex items-center justify-end gap-2 lg:ml-auto">
              <Label
                variant={EVariantLabel.caption}
                color="text-gray-600"
                className="tabular-nums"
              >
                {tCommon('showingRange', { from, to, total })}
              </Label>
              <Icon
                name={IconComponentsEnum.chevronLeft}
                size={ESize.md}
                color={page > 1 ? 'text-gray-700' : 'text-gray-300'}
                handleClick={page > 1 ? () => setPage(page - 1) : undefined}
                className={page > 1 ? 'cursor-pointer' : 'cursor-not-allowed'}
              />
              <Icon
                name={IconComponentsEnum.chevronRight}
                size={ESize.md}
                color={page < lastPage ? 'text-gray-700' : 'text-gray-300'}
                handleClick={
                  page < lastPage ? () => setPage(page + 1) : undefined
                }
                className={
                  page < lastPage ? 'cursor-pointer' : 'cursor-not-allowed'
                }
              />
            </Div>
          </Div>

          {isLoading ? (
            <Div className="flex justify-center py-16">
              <Spinner size={ESize.lg} color="text-primary-500" />
            </Div>
          ) : null}

          {!isLoading && products.length === 0 ? (
            <Div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                {t('empty')}
              </Label>
            </Div>
          ) : null}

          <Div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Div>
        </Div>
      }
    />
  )
}

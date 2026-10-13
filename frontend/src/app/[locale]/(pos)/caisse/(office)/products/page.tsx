'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import LayoutWrapper from '@/components/Layouts/LayoutWrapper'
import PosExportInventoryModal from '@/components/Modals/PosExportInventoryModal/PosExportInventoryModal'
import PosThumbnail from '@/components/Organisms/Pos/PosThumbnail'
import Badge from '@/components/Primitives/Badge/Badge'
import Button from '@/components/Primitives/Button/Button'
import Div from '@/components/Primitives/Div/Div'
import Dropdown from '@/components/Primitives/Dropdown/Dropdown'
import Icon from '@/components/Primitives/Icon/Icon'
import Input from '@/components/Primitives/Input/Input'
import Label from '@/components/Primitives/Label/Label'
import Spinner from '@/components/Primitives/Spinner/Spinner'
import { useModal } from '@/contexts/ModalContext'
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
  const { openModal: openExportModal, modalPortal: exportModalPortal } = useModal()
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
    <>
      {exportModalPortal(
        <PosExportInventoryModal
          categories={categories}
          initialCategoryId={categoryFilter}
        />
      )}
      <LayoutWrapper
        title={t('title')}
        subTitle={t('subtitle')}
        rightActions={
          <Div className="flex items-center gap-2">
            <Button
              id="pos-products-export-inventory-btn"
              type={EButtonType.secondary}
              size={EButtonSize.medium}
              iconPosition="left"
              icon={{
                name: IconComponentsEnum.filetext,
                size: ESize.sm,
                color: 'text-primary-600',
              }}
              text={t('exportInventory')}
              onClick={openExportModal}
            />
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
          </Div>
        }
      mainSection={
        <Div className="space-y-4">
          <Div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              id="pos-products-search"
              leftIcon={IconComponentsEnum.search}
              rightIcon={search ? IconComponentsEnum.close : undefined}
              onRightIconClick={() => setSearch('')}
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearch('')
              }}
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
              className={categoryFilter !== ALL ? 'border-primary-300 bg-primary-50/20' : ''}
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
              className={availability !== 'all' ? 'border-primary-300 bg-primary-50/20' : ''}
              containerClassName="w-full lg:w-56"
            />
            <Div className="flex items-center justify-end gap-3 lg:ms-auto">
              <Label
                variant={EVariantLabel.caption}
                color="text-gray-600"
                className="tabular-nums text-xs font-medium"
              >
                {tCommon('showingRange', { from, to, total })}
              </Label>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                  className="flex size-8 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <Icon
                    name={IconComponentsEnum.chevronLeft}
                    size={ESize.sm}
                    color={page > 1 ? 'text-gray-700' : 'text-gray-300'}
                  />
                </button>
                <span className="px-2 text-xs font-semibold text-gray-700 tabular-nums">
                  {page} / {Math.max(lastPage, 1)}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                  className="flex size-8 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <Icon
                    name={IconComponentsEnum.chevronRight}
                    size={ESize.sm}
                    color={page < lastPage ? 'text-gray-700' : 'text-gray-300'}
                  />
                </button>
              </div>
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
    </>
  )
}

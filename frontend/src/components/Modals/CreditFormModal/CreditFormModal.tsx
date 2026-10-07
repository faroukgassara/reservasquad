'use client'

import { useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Modal from '@/components/Primitives/Modal/Modal'
import {
  DrawerActions,
  DrawerForm,
  DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout'
import Div from '@/components/Primitives/Div/Div'
import Input from '@/components/Primitives/Input/Input'
import Label from '@/components/Primitives/Label/Label'
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField'
import Dropdown from '@/components/Primitives/Dropdown/Dropdown'
import Button from '@/components/Primitives/Button/Button'
import { useCurrentModal } from '@/contexts/ModalContext'
import {
  EButtonSize,
  EButtonType,
  EInputType,
  EVariantLabel,
} from '@/Enum/Enum'
import { formatMoney } from '@/lib/daily-income-api'
import { todayDateInputValue } from '@/lib/credit-api'
import {
  fetchAvailablePosProducts,
  round3,
  toAmount,
  type PosProduct,
} from '@/lib/pos-api'

function parseQuantity(value: string): number {
  return Number(value.replace(',', '.'))
}

function productTotal(
  product: PosProduct | undefined,
  quantity: string
): number {
  const qty = parseQuantity(quantity)
  return product && qty > 0 ? round3(toAmount(product.price) * qty) : 0
}

export interface CreditFormValues {
  date: string
  productId: string
  quantity: number
  description: string
}

interface CreditFormModalProps {
  clientName: string
  onSubmit: (values: CreditFormValues) => Promise<void>
  isLoading?: boolean
}

export default function CreditFormModal({
  clientName,
  onSubmit,
  isLoading = false,
}: Readonly<CreditFormModalProps>) {
  const t = useTranslations('admin.credits')
  const tCommon = useTranslations('common')
  const { closeModal } = useCurrentModal()

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products-available'],
    queryFn: fetchAvailablePosProducts,
  })
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )
  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} · ${formatMoney(toAmount(p.price))}`,
      })),
    [products]
  )

  const form = useForm({
    defaultValues: {
      date: todayDateInputValue(),
      productId: '',
      quantity: '1',
      description: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        date: value.date,
        productId: value.productId,
        quantity: parseQuantity(value.quantity),
        description: value.description,
      })
      closeModal()
    },
  })

  return (
    <Modal
      title={t('createCredit')}
      subTitle={clientName}
      canClose
      canCloseOnClickOutisde
      isDrawer
    >
      <DrawerForm
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <DrawerScrollContent>
          <form.Field
            name="date"
            validators={{
              onSubmit: ({ value }) =>
                value ? undefined : t('fieldRequired', { field: t('date') }),
            }}
          >
            {({ state, handleChange }) => (
              <div>
                <DatePickerField
                  id="credit-date"
                  label={t('date')}
                  required
                  value={state.value}
                  error={!!state.meta.errors?.length}
                  onChange={handleChange}
                />
                {state.meta.errors?.[0] ? (
                  <Label
                    variant={EVariantLabel.hint}
                    color="text-danger-500"
                    className="mt-1.5 block"
                  >
                    {state.meta.errors[0]}
                  </Label>
                ) : null}
              </div>
            )}
          </form.Field>
          <form.Field
            name="productId"
            validators={{
              onSubmit: ({ value }) =>
                value ? undefined : t('productRequired'),
            }}
          >
            {({ state, handleChange }) => (
              <Dropdown
                label={t('product')}
                placeholder={t('pickProduct')}
                options={productOptions}
                value={state.value}
                onChange={(value) => handleChange(String(value))}
                searchable
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
          <Div className="grid grid-cols-2 gap-4">
            <form.Field
              name="quantity"
              validators={{
                onSubmit: ({ value }) =>
                  parseQuantity(value) > 0 ? undefined : t('quantityInvalid'),
              }}
            >
              {({ state, handleChange }) => (
                <Input
                  id="credit-quantity"
                  label={t('quantity')}
                  type={EInputType.number}
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
            <form.Subscribe
              selector={(state) => [
                state.values.productId,
                state.values.quantity,
              ]}
            >
              {([productId, quantity]) => (
                <Input
                  id="credit-amount"
                  label={t('amount')}
                  value={formatMoney(
                    productTotal(productById.get(productId), quantity)
                  )}
                  readOnly
                  disabled
                />
              )}
            </form.Subscribe>
          </Div>
          <form.Field name="description">
            {({ state, handleChange }) => (
              <Input
                label={t('description')}
                value={state.value}
                id="credit-description"
                isTextArea
                onChange={(e) => handleChange(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
              />
            )}
          </form.Field>
        </DrawerScrollContent>
        <DrawerActions>
          <Button
            id="credit-cancel"
            type={EButtonType.secondary}
            size={EButtonSize.medium}
            text={tCommon('cancel')}
            onClick={closeModal}
            className="flex-1"
          />
          <Button
            id="credit-submit"
            type={EButtonType.primary}
            size={EButtonSize.medium}
            text={tCommon('save')}
            isLoading={isLoading}
            onClick={() => form.handleSubmit()}
            className="flex-1"
          />
        </DrawerActions>
      </DrawerForm>
    </Modal>
  )
}

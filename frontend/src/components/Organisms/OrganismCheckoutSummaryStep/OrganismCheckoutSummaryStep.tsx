'use client';

import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { formatProductMoney } from '@/lib/product-api';
import type { ShippingMethod } from '@/lib/order-api';
import type { CheckoutDeliveryValues } from '@/types/checkout';

type OrganismCheckoutSummaryStepProps = Readonly<{
    delivery: CheckoutDeliveryValues;
    shippingMethod: ShippingMethod;
    shippingFee: number;
    isSubmitting?: boolean;
    onBack: () => void;
    onConfirm: () => void;
}>;

export default function OrganismCheckoutSummaryStep({
    delivery,
    shippingMethod,
    shippingFee,
    isSubmitting = false,
    onBack,
    onConfirm,
}: OrganismCheckoutSummaryStepProps) {
    const t = useTranslations('checkout');
    const locale = useLocale();

    return (
        <Div className="space-y-5">
            <Label variant={EVariantLabel.h5} color="text-primary-500" className="block">
                {t('summaryTitle')}
            </Label>

            <Div className="space-y-4 rounded-xl border border-gray-200 bg-gray-25 p-4">
                <Div className="flex flex-col gap-1">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('deliveryTitle')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-900" className="block">
                        {delivery.firstName} {delivery.lastName}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block">
                        {delivery.email} · {delivery.phone}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block">
                        {delivery.address}, {delivery.city}, {delivery.governorate}{' '}
                        {delivery.postalCode}
                    </Label>
                </Div>
                <Div className="flex flex-col gap-1 border-t border-gray-200 pt-4">
                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                        {t('shippingTitle')}
                    </Label>
                    <Label variant={EVariantLabel.body} color="text-gray-900" className="block">
                        {t(`shippingMethods.${shippingMethod}.label`)} —{' '}
                        {shippingFee === 0
                            ? t('shippingFree')
                            : formatProductMoney(shippingFee, locale)}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block">
                        {t(`shippingMethods.${shippingMethod}.eta`)}
                    </Label>
                </Div>
            </Div>

            <Div className="flex items-center justify-between gap-4 pt-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-primary-500 hover:underline"
                >
                    {t('back')}
                </button>
                <Button
                    id="checkout-confirm"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={t('confirm')}
                    isLoading={isSubmitting}
                    onClick={onConfirm}
                />
            </Div>
        </Div>
    );
}

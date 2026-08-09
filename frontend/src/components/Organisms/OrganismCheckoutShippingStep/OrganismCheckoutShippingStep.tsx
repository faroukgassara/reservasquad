'use client';

import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatProductMoney } from '@/lib/product-api';
import { SHIPPING_OPTIONS, type ShippingMethod } from '@/lib/order-api';
import { twMerge } from 'tailwind-merge';

type OrganismCheckoutShippingStepProps = Readonly<{
    shippingMethod: ShippingMethod;
    onShippingMethodChange: (method: ShippingMethod) => void;
    onBack: () => void;
    onContinue: () => void;
}>;

export default function OrganismCheckoutShippingStep({
    shippingMethod,
    onShippingMethodChange,
    onBack,
    onContinue,
}: OrganismCheckoutShippingStepProps) {
    const t = useTranslations('checkout');
    const locale = useLocale();

    return (
        <Div className="space-y-5">
            <Label variant={EVariantLabel.h5} color="text-primary-500" className="block">
                {t('shippingTitle')}
            </Label>

            <Div className="space-y-3">
                {SHIPPING_OPTIONS.map((option) => {
                    const selected = shippingMethod === option.method;
                    return (
                        <button
                            key={option.method}
                            type="button"
                            onClick={() => onShippingMethodChange(option.method)}
                            className={twMerge(
                                'flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-start transition-colors',
                                selected
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-primary-300',
                            )}
                        >
                            <Div className="flex items-center gap-3">
                                <span
                                    className={twMerge(
                                        'flex size-4 items-center justify-center rounded-full border',
                                        selected ? 'border-primary-500' : 'border-gray-300',
                                    )}
                                >
                                    {selected && (
                                        <span className="size-2 rounded-full bg-primary-500" />
                                    )}
                                </span>
                                <Div className="flex flex-col gap-1">
                                    <Label variant={EVariantLabel.body} color="text-gray-900">
                                        {t(`shippingMethods.${option.method}.label`)}
                                    </Label>
                                    <Label
                                        variant={EVariantLabel.caption}
                                        color="text-gray-500"
                                        className="block"
                                    >
                                        {t(`shippingMethods.${option.method}.eta`)}
                                    </Label>
                                </Div>
                            </Div>
                            <Label variant={EVariantLabel.body} color="text-gray-900">
                                {option.fee === 0
                                    ? t('shippingFree')
                                    : formatProductMoney(option.fee, locale)}
                            </Label>
                        </button>
                    );
                })}
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
                    id="checkout-shipping-continue"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={t('continue')}
                    icon={{
                        name: IconComponentsEnum.arrowRight,
                        size: ESize.sm,
                        color: 'text-white',
                    }}
                    iconPosition="right"
                    onClick={onContinue}
                />
            </Div>
        </Div>
    );
}

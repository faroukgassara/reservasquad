'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Stepper from '@/components/Primitives/Stepper/Stepper';
import OrganismCheckoutOrderSummary from '@/components/Organisms/OrganismCheckoutOrderSummary/OrganismCheckoutOrderSummary';
import OrganismCheckoutDeliveryStep from '@/components/Organisms/OrganismCheckoutDeliveryStep/OrganismCheckoutDeliveryStep';
import OrganismCheckoutShippingStep from '@/components/Organisms/OrganismCheckoutShippingStep/OrganismCheckoutShippingStep';
import OrganismCheckoutSummaryStep from '@/components/Organisms/OrganismCheckoutSummaryStep/OrganismCheckoutSummaryStep';
import { EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useCart } from '@/contexts/CartContext';
import { Link, useRouter } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { createOrder, getShippingFee, type ShippingMethod } from '@/lib/order-api';
import { useToast } from '@/contexts/ToastContext';
import type { CheckoutDeliveryValues, CheckoutStepId } from '@/types/checkout';
import type { StepperItem } from '@/interfaces/IPrimitives/IStepper/IStepper';

const CHECKOUT_STEP_IDS: CheckoutStepId[] = ['delivery', 'shipping', 'summary'];

export default function TemplateCheckout() {
    const t = useTranslations('checkout');
    const tCart = useTranslations('cart');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const router = useRouter();
    const { openToast } = useToast();
    const { data: session } = useSession();
    const { items, subtotal, clearCart } = useCart();

    const [step, setStep] = useState<CheckoutStepId>('delivery');
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('STANDARD');
    const [delivery, setDelivery] = useState<CheckoutDeliveryValues | null>(null);

    const isAuthenticated = Boolean(session?.user);
    const lockedFields = useMemo(
        () => ({
            firstName: session?.user?.firstName ?? '',
            lastName: session?.user?.lastName ?? '',
            email: session?.user?.email ?? '',
            phone: session?.user?.phone ?? '',
        }),
        [session?.user],
    );

    const shippingFee = getShippingFee(shippingMethod);

    const stepperSteps = useMemo<StepperItem[]>(
        () => [
            {
                id: 'delivery',
                label: t('steps.delivery'),
                icon: IconComponentsEnum.home,
            },
            {
                id: 'shipping',
                label: t('steps.shipping'),
                icon: IconComponentsEnum.truck,
            },
            {
                id: 'summary',
                label: t('steps.summary'),
                icon: IconComponentsEnum.checkCircle,
            },
        ],
        [t],
    );

    const placeOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (order) => {
            clearCart();
            openToast(t('successTitle'), t('successMessage', { number: order.number }), {
                type: EToastType.SUCCESS,
            });
            router.push(Routes.Shop.index);
        },
        onError: (error: Error) => {
            openToast(t('errors.title'), error.message, { type: EToastType.ERROR });
        },
    });

    const handleStepperClick = (stepId: string) => {
        if (!CHECKOUT_STEP_IDS.includes(stepId as CheckoutStepId)) return;
        const target = stepId as CheckoutStepId;
        const currentIndex = CHECKOUT_STEP_IDS.indexOf(step);
        const targetIndex = CHECKOUT_STEP_IDS.indexOf(target);
        if (targetIndex < currentIndex) {
            setStep(target);
        }
    };

    const confirmOrder = () => {
        if (!delivery) {
            setStep('delivery');
            return;
        }

        placeOrderMutation.mutate({
            ...delivery,
            shippingMethod,
            lines: items.map((line) => ({
                productId: line.productId,
                productTitle: line.title,
                productSlug: line.slug,
                imageUrl: line.imageUrl || undefined,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                material: line.materialKey,
                size: line.sizeKey,
                engraving: line.engraving,
            })),
        });
    };

    if (items.length === 0) {
        return (
            <section dir={isRtl ? 'rtl' : 'ltr'} className="bg-gray-25 pb-16 pt-8 sm:pt-10">
                <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Label variant={EVariantLabel.h1} color="text-primary-500" className="mb-8 block">
                        {t('title')}
                    </Label>
                    <Div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                        <Label variant={EVariantLabel.h5} color="text-primary-500" className="mb-3">
                            {tCart('emptyTitle')}
                        </Label>
                        <Label variant={EVariantLabel.body} color="text-gray-600" className="mb-8">
                            {t('emptyCartBody')}
                        </Label>
                        <Link
                            href={Routes.Shop.index}
                            className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-8 text-sm font-semibold text-white hover:bg-primary-600"
                        >
                            {tCart('exploreShop')}
                        </Link>
                    </Div>
                </Div>
            </section>
        );
    }

    return (
        <section dir={isRtl ? 'rtl' : 'ltr'} className="bg-gray-25 pb-16 pt-8 sm:pt-10">
            <Div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Label variant={EVariantLabel.h1} color="text-primary-500" className="mb-6 block">
                    {t('title')}
                </Label>

                <Stepper
                    steps={stepperSteps}
                    currentStepId={step}
                    className="mb-8"
                    onStepClick={handleStepperClick}
                />

                <Div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <Div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                        {step === 'delivery' && (
                            <OrganismCheckoutDeliveryStep
                                isAuthenticated={isAuthenticated}
                                lockedFields={lockedFields}
                                initialValues={delivery ?? undefined}
                                onContinue={(values) => {
                                    setDelivery(values);
                                    setStep('shipping');
                                }}
                            />
                        )}

                        {step === 'shipping' && (
                            <OrganismCheckoutShippingStep
                                shippingMethod={shippingMethod}
                                onShippingMethodChange={setShippingMethod}
                                onBack={() => setStep('delivery')}
                                onContinue={() => setStep('summary')}
                            />
                        )}

                        {step === 'summary' && delivery && (
                            <OrganismCheckoutSummaryStep
                                delivery={delivery}
                                shippingMethod={shippingMethod}
                                shippingFee={shippingFee}
                                isSubmitting={placeOrderMutation.isPending}
                                onBack={() => setStep('shipping')}
                                onConfirm={confirmOrder}
                            />
                        )}
                    </Div>

                    <OrganismCheckoutOrderSummary
                        items={items}
                        subtotal={subtotal}
                        shippingFee={shippingFee}
                    />
                </Div>
            </Div>
        </section>
    );
}

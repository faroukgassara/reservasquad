'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import OrganismPosOrderPanel from '@/components/Organisms/Pos/OrganismPosOrderPanel';
import OrganismPosPaymentScreen from '@/components/Organisms/Pos/OrganismPosPaymentScreen';
import OrganismPosProductGrid from '@/components/Organisms/Pos/OrganismPosProductGrid';
import OrganismPosReceiptScreen from '@/components/Organisms/Pos/OrganismPosReceiptScreen';
import OrganismPosRegisterBar from '@/components/Organisms/Pos/OrganismPosRegisterBar';
import PosClientPickerModal from '@/components/Modals/PosClientPickerModal/PosClientPickerModal';
import PosCloseSessionModal from '@/components/Modals/PosCloseSessionModal/PosCloseSessionModal';
import PosCreditPaymentModal from '@/components/Modals/PosCreditPaymentModal/PosCreditPaymentModal';
import PosDocumentPickerModal, {
    type DocumentPaymentKind,
    type PayableDocument,
} from '@/components/Modals/PosDocumentPickerModal/PosDocumentPickerModal';
import PosSessionOrdersModal from '@/components/Modals/PosSessionOrdersModal/PosSessionOrdersModal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { PosCartProvider, usePosCart } from '@/contexts/PosCartContext';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { EButtonSize, EButtonType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { formatMoney } from '@/lib/daily-income-api';
import {
    closePosSession,
    createPosOrder,
    fetchAvailablePosProducts,
    fetchCurrentPosSession,
    fetchPosCategories,
    fetchPosOrders,
    personName,
    type PosOrderDetail,
    type PosPaymentMethod,
    type PosSession,
} from '@/lib/pos-api';
import { Routes } from '@/lib/routes';

type RegisterScreen = 'products' | 'payment' | 'receipt';
type MobileView = 'products' | 'order';

function PosRegister({ session }: Readonly<{ session: PosSession }>) {
    const t = useTranslations('pos.register');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const cart = usePosCart();
    const [screen, setScreen] = useState<RegisterScreen>('products');
    const [mobileView, setMobileView] = useState<MobileView>('products');
    const [lastOrder, setLastOrder] = useState<PosOrderDetail | null>(null);

    const clientModal = useModal();
    const invoiceModal = useModal();
    const subscriptionModal = useModal();
    const creditPaymentModal = useModal();
    const ordersModal = useModal();
    const closeModal = useModal();

    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ['pos-products-available'],
        queryFn: fetchAvailablePosProducts,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['pos-categories'],
        queryFn: fetchPosCategories,
    });

    const { data: sessionOrders } = useQuery({
        queryKey: ['pos-orders', 'session-count', session.id],
        queryFn: () => fetchPosOrders({ sessionId: session.id, page: 1, perPage: 1 }),
    });

    const onError = (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR });

    const orderMutation = useMutation({
        mutationFn: createPosOrder,
        onSuccess: (result) => {
            void queryClient.invalidateQueries({ queryKey: ['pos-products-available'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-product-stats'] });
            void queryClient.invalidateQueries({ queryKey: ['credit-clients'] });
            void queryClient.invalidateQueries({ queryKey: ['credit-client'] });
            void queryClient.invalidateQueries({ queryKey: ['credit-summary'] });
            if ('onCredit' in result) {
                openToast(
                    t('creditSaleTitle'),
                    t('creditSaleDone', { name: personName(cart.client), total: formatMoney(result.total) }),
                    { type: EToastType.SUCCESS },
                );
                cart.clear();
                startNewOrder();
                return;
            }
            void queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-session-summary'] });
            void queryClient.invalidateQueries({ queryKey: ['sale-orders'] });
            void queryClient.invalidateQueries({ queryKey: ['sale-order'] });
            void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            void queryClient.invalidateQueries({ queryKey: ['subscription'] });
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            void queryClient.invalidateQueries({ queryKey: ['invoice'] });
            cart.clear();
            setLastOrder(result);
            setScreen('receipt');
        },
        onError,
    });

    const closeMutation = useMutation({
        mutationFn: (body: { countedCash: number; note?: string; syncDailyIncome?: boolean }) =>
            closePosSession(session.id, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['pos-session-current'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-session-last-closed'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-sessions'] });
            void queryClient.invalidateQueries({ queryKey: ['pos-session-summary'] });
            void queryClient.invalidateQueries({ queryKey: ['daily-income'] });
            void queryClient.invalidateQueries({ queryKey: ['daily-income-summary'] });
            void queryClient.invalidateQueries({ queryKey: ['daily-income-trend'] });
            cart.clear();
            closeModal.closeModal();
            router.push(Routes.Pos.index);
        },
        onError,
    });

    const validateOrder = (payments: { method: PosPaymentMethod; amount: number }[]) => {
        orderMutation.mutate({
            lines: cart.lines.map((line) =>
                line.saleOrderId || line.subscriptionId || line.creditId || line.invoiceId
                    ? {
                          saleOrderId: line.saleOrderId ?? undefined,
                          subscriptionId: line.subscriptionId ?? undefined,
                          creditId: line.creditId ?? undefined,
                          invoiceId: line.invoiceId ?? undefined,
                          creditRemainder: line.creditRemainder || undefined,
                          quantity: 1,
                          unitPrice: line.unitPrice,
                          discountPct: 0,
                      }
                    : {
                          productId: line.productId ?? undefined,
                          quantity: line.quantity,
                          unitPrice: line.unitPrice,
                          discountPct: line.discountPct,
                      },
            ),
            payments,
            creditClientId: cart.client?.id,
            note: cart.note.trim() || undefined,
        });
    };

    const documentLine = ({ document, amount, kind }: { document: PayableDocument; amount: number; kind: DocumentPaymentKind }) => ({
        name: t(kind === 'settle' ? 'saleOrderSettleLine' : 'saleOrderDepositLine', { number: document.number }),
        creditRemainder: kind === 'deposit',
        amount,
        client: document.client,
    });

    const startNewOrder = () => {
        setLastOrder(null);
        setScreen('products');
        setMobileView('products');
    };

    const renderBody = () => {
        if (screen === 'receipt' && lastOrder) {
            return <OrganismPosReceiptScreen order={lastOrder} onNewOrder={startNewOrder} />;
        }
        if (screen === 'payment') {
            return (
                <OrganismPosPaymentScreen
                    isSubmitting={orderMutation.isPending}
                    onBack={() => setScreen('products')}
                    onPickClient={() => clientModal.openModal()}
                    onValidate={validateOrder}
                />
            );
        }
        const canPay = cart.lines.length > 0 && cart.lines.every((l) => l.quantity !== 0) && cart.total >= 0;
        return (
            <Div className="flex min-h-0 flex-1 flex-col tablet:flex-row">
                <Div
                    className={twMerge(
                        'min-h-0 flex-1 flex-col tablet:flex',
                        mobileView === 'products' ? 'flex' : 'hidden',
                    )}
                >
                    <OrganismPosProductGrid
                        products={products}
                        categories={categories}
                        isLoading={productsLoading}
                        onAdd={cart.addProduct}
                    />
                </Div>
                <Div
                    className={twMerge(
                        'min-h-0 flex-1 flex-col border-gray-200 tablet:order-first tablet:flex tablet:w-96 tablet:flex-none tablet:border-e laptop:w-[460px] xl:w-[500px] 2xl:w-[540px]',
                        mobileView === 'order' ? 'flex' : 'hidden',
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setMobileView('products')}
                        className="flex min-h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 text-start tablet:hidden"
                    >
                        <Icon
                            name={IconComponentsEnum.arrowLeft}
                            size={ESize.sm}
                            color="text-primary-600"
                            className="rtl:-scale-x-100"
                        />
                        <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="font-medium">
                            {t('mobileProducts')}
                        </Label>
                    </button>
                    <Div className="min-h-0 flex-1">
                        <OrganismPosOrderPanel
                            onPay={() => setScreen('payment')}
                            onPickInvoice={() => invoiceModal.openModal()}
                            onPickSubscription={() => subscriptionModal.openModal()}
                            onPickCreditPayment={() => creditPaymentModal.openModal()}
                        />
                    </Div>
                </Div>
                {mobileView === 'products' ? (
                    <Div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] tablet:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileView('order')}
                            className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg bg-gray-100 px-3 text-start"
                        >
                            <Icon name={IconComponentsEnum.shoppingCart} size={ESize.sm} color="text-primary-600" />
                            <Label
                                variant={EVariantLabel.bodySmall}
                                color="text-gray-900"
                                className="truncate font-medium tabular-nums"
                            >
                                {t('mobileOrder', { count: cart.itemsCount, total: formatMoney(cart.total) })}
                            </Label>
                        </button>
                        <Button
                            id="pos-mobile-pay"
                            type={EButtonType.primary}
                            size={EButtonSize.large}
                            text={t('payment')}
                            disabled={!canPay}
                            onClick={() => setScreen('payment')}
                            className="h-12 shrink-0 rounded-lg px-5"
                        />
                    </Div>
                ) : null}
            </Div>
        );
    };

    return (
        <>
            <OrganismPosRegisterBar
                sessionNumber={session.number}
                ordersCount={sessionOrders?.meta.total ?? 0}
                onOrders={() => ordersModal.openModal()}
                onCloseSession={() => closeModal.openModal()}
            />
            <Div className="flex min-h-0 flex-1 flex-col">{renderBody()}</Div>

            {clientModal.modalPortal(
                <PosClientPickerModal selectedId={cart.client?.id} onSelect={cart.setClient} />,
            )}
            {invoiceModal.modalPortal(
                <PosDocumentPickerModal
                    source="invoice"
                    onSelect={(selection) => cart.addDocumentLine({ invoiceId: selection.document.id, ...documentLine(selection) })}
                />,
            )}
            {subscriptionModal.modalPortal(
                <PosDocumentPickerModal
                    source="subscription"
                    onSelect={(selection) => cart.addDocumentLine({ subscriptionId: selection.document.id, ...documentLine(selection) })}
                />,
            )}
            {creditPaymentModal.modalPortal(
                <PosCreditPaymentModal
                    onSelect={({ client, credit, amount }) =>
                        cart.addDocumentLine({
                            creditId: credit.id,
                            name: t('creditPaymentLine', { name: credit.label }),
                            amount,
                            client,
                        })
                    }
                />,
            )}
            {ordersModal.modalPortal(<PosSessionOrdersModal sessionId={session.id} />)}
            {closeModal.modalPortal(
                <PosCloseSessionModal
                    sessionId={session.id}
                    onSubmit={(values) => closeMutation.mutate(values)}
                    isLoading={closeMutation.isPending}
                />,
            )}
        </>
    );
}

export default function PosRegisterPage() {
    const router = useRouter();
    const { data: session, isLoading } = useQuery({
        queryKey: ['pos-session-current'],
        queryFn: fetchCurrentPosSession,
    });

    useEffect(() => {
        if (!isLoading && !session) router.replace(Routes.Pos.index);
    }, [isLoading, session, router]);

    if (!session) {
        return (
            <Div className="flex flex-1 items-center justify-center">
                <Spinner size={ESize.lg} color="text-primary-500" />
            </Div>
        );
    }

    return (
        <PosCartProvider sessionId={session.id}>
            <PosRegister session={session} />
        </PosCartProvider>
    );
}

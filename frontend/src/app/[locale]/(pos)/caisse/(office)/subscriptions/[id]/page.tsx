'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import PosClientPickerModal from '@/components/Modals/PosClientPickerModal/PosClientPickerModal';
import PosInfoRow from '@/components/Organisms/Pos/PosInfoRow';
import PosStatButton from '@/components/Organisms/Pos/PosStatButton';
import PosStatusPipeline from '@/components/Organisms/Pos/PosStatusPipeline';
import Badge from '@/components/Primitives/Badge/Badge';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Dropdown from '@/components/Primitives/Dropdown/Dropdown';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import PosRenewSubscriptionModal from '@/components/Modals/PosRenewSubscriptionModal/PosRenewSubscriptionModal';
import PosFormFooter from '@/components/Organisms/Pos/PosFormFooter';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { fetchCreditClient } from '@/lib/credit-api';
import { formatMoney } from '@/lib/daily-income-api';
import {
    activateSubscription,
    cancelSubscription,
    createInvoiceFromSubscription,
    createSubscription,
    deleteSubscription,
    fetchPosProducts,
    fetchSubscription,
    formatPosDate,
    formatSubscriptionNumber,
    personName,
    renewSubscription,
    round3,
    subscriptionDisplayStatus,
    subscriptionEndDate,
    toAmount,
    toDateInput,
    todayInput,
    updateSubscription,
    type PosClientRef,
    type PosProduct,
    type SubscriptionDetail,
    type SubscriptionInput,
} from '@/lib/pos-api';
import { SUBSCRIPTION_STATUS_BADGE } from '@/lib/pos-documents';
import { Routes } from '@/lib/routes';
import {
    EBadgeSize,
    EButtonSize,
    EButtonType,
    EInputType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

interface SubscriptionForm {
    client: PosClientRef | null;
    productId: string;
    startDate: string;
    unitPrice: string;
    discountPct: string;
    note: string;
}

type ModalState = 'client' | 'renew' | 'cancel' | 'delete' | null;

function parseNumber(value: string): number {
    return Number(value.replace(',', '.'));
}

function formFromSubscription(subscription: SubscriptionDetail): SubscriptionForm {
    return {
        client: subscription.client,
        productId: subscription.productId ?? '',
        startDate: toDateInput(subscription.startDate),
        unitPrice: String(toAmount(subscription.unitPrice)),
        discountPct: String(toAmount(subscription.discountPct)),
        note: subscription.note ?? '',
    };
}

export default function PosSubscriptionPage() {
    const t = useTranslations('pos.subscriptions');
    const tProducts = useTranslations('pos.products');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const subscriptionId = params.id;
    const isNew = subscriptionId === 'new';
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [modalState, setModalState] = useState<ModalState>(null);
    const { openModal, closeModal, modalPortal } = useModal({ closeCallBack: () => setModalState(null) });
    const [form, setForm] = useState<SubscriptionForm | null>(() =>
        isNew
            ? { client: null, productId: '', startDate: todayInput(), unitPrice: '', discountPct: '0', note: '' }
            : null,
    );
    const [dirty, setDirty] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const { data: subscription, isLoading } = useQuery({
        queryKey: ['subscription', subscriptionId],
        queryFn: () => fetchSubscription(subscriptionId),
        enabled: !isNew,
    });

    const presetClientId = isNew ? searchParams.get('client') : null;
    const { data: presetClient } = useQuery({
        queryKey: ['credit-client', presetClientId],
        queryFn: () => fetchCreditClient(presetClientId!),
        enabled: !!presetClientId,
    });

    useEffect(() => {
        if (!presetClient) return;
        setForm((current) => (current && !current.client ? { ...current, client: presetClient } : current));
    }, [presetClient]);

    const { data: products } = useQuery({
        queryKey: ['pos-products', 'subscriptions'],
        queryFn: () => fetchPosProducts({ page: 1, perPage: 100, subscription: true }),
    });
    const productList = useMemo(() => products?.data ?? [], [products]);

    useEffect(() => {
        if (!subscription) return;
        setForm(formFromSubscription(subscription));
        setDirty(false);
        setShowErrors(false);
    }, [subscription]);

    const status = subscription?.status ?? 'DRAFT';
    const displayStatus = subscription ? subscriptionDisplayStatus(subscription) : 'DRAFT';
    const editable = isNew || status === 'DRAFT';
    const activeInvoice = subscription?.invoices.find(
        (invoice) => invoice.type === 'INVOICE' && invoice.status !== 'CANCELLED',
    );
    const hasPostedInvoice = !!subscription?.invoices.some(
        (invoice) => invoice.type === 'INVOICE' && invoice.status === 'POSTED',
    );

    const selectedProduct: PosProduct | undefined = productList.find((product) => product.id === form?.productId);

    const preview = useMemo(() => {
        if (!form) return null;
        const unitPrice = parseNumber(form.unitPrice) || 0;
        const discountPct = parseNumber(form.discountPct) || 0;
        const taxRate = selectedProduct ? toAmount(selectedProduct.taxRate) : toAmount(subscription?.taxRate);
        const subtotal = round3(unitPrice * (1 - discountPct / 100));
        const taxAmount = round3((subtotal * taxRate) / 100);
        const endDate =
            selectedProduct?.subscriptionDuration && selectedProduct.subscriptionUnit && form.startDate
                ? subscriptionEndDate(form.startDate, selectedProduct.subscriptionDuration, selectedProduct.subscriptionUnit)
                : toDateInput(subscription?.endDate);
        return { subtotal, taxAmount, total: round3(subtotal + taxAmount), taxRate, endDate };
    }, [form, selectedProduct, subscription]);

    const patchForm = (patch: Partial<SubscriptionForm>) => {
        setForm((current) => (current ? { ...current, ...patch } : current));
        setDirty(true);
    };

    const open = useCallback(
        (state: NonNullable<ModalState>) => {
            setModalState(state);
            openModal();
        },
        [openModal],
    );

    const onError = (error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR });

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
        void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    };

    const buildPayload = (): SubscriptionInput | null => {
        if (!form) return null;
        const unitPrice = parseNumber(form.unitPrice);
        const discountPct = parseNumber(form.discountPct || '0');
        const pricesValid =
            Number.isFinite(unitPrice) && unitPrice >= 0 && Number.isFinite(discountPct) && discountPct >= 0 && discountPct <= 100;
        if (!form.client || !form.productId || !form.startDate || !pricesValid) {
            setShowErrors(true);
            openToast(tCommon('error'), form.client ? t('invalidForm') : t('clientRequired'), {
                type: EToastType.ERROR,
            });
            return null;
        }
        return {
            clientId: form.client.id,
            productId: form.productId,
            startDate: form.startDate,
            unitPrice,
            discountPct,
            note: form.note.trim() || null,
        };
    };

    const saveMutation = useMutation({
        mutationFn: (payload: SubscriptionInput) =>
            isNew ? createSubscription(payload) : updateSubscription(subscriptionId, payload),
        onSuccess: (saved) => {
            void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            openToast(tCommon('success'), t('saved'), { type: EToastType.SUCCESS });
            if (isNew) {
                router.replace(Routes.Pos.subscription(saved.id));
                return;
            }
            refresh();
        },
        onError,
    });

    const activateMutation = useMutation({
        mutationFn: async (payload: SubscriptionInput | null) => {
            if (payload) await updateSubscription(subscriptionId, payload);
            return activateSubscription(subscriptionId);
        },
        onSuccess: () => {
            refresh();
            openToast(tCommon('success'), t('activated'), { type: EToastType.SUCCESS });
        },
        onError,
    });

    const cancelMutation = useMutation({
        mutationFn: () => cancelSubscription(subscriptionId),
        onSuccess: () => {
            refresh();
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), t('cancelled'), { type: EToastType.SUCCESS });
            closeModal();
        },
        onError,
    });

    const renewMutation = useMutation({
        mutationFn: (startDate: string) => renewSubscription(subscriptionId, startDate),
        onSuccess: (renewal) => {
            refresh();
            closeModal();
            openToast(tCommon('success'), t('renewed'), { type: EToastType.SUCCESS });
            router.push(Routes.Pos.subscription(renewal.id));
        },
        onError,
    });

    const invoiceMutation = useMutation({
        mutationFn: () => createInvoiceFromSubscription(subscriptionId),
        onSuccess: (invoice) => {
            refresh();
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            router.push(Routes.Pos.invoice(invoice.id));
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteSubscription(subscriptionId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            closeModal();
            router.push(Routes.Pos.subscriptions);
        },
        onError,
    });

    const handleSave = () => {
        const payload = buildPayload();
        if (payload) saveMutation.mutate(payload);
    };

    const handleActivate = () => {
        let payload: SubscriptionInput | null = null;
        if (dirty) {
            payload = buildPayload();
            if (!payload) return;
        }
        activateMutation.mutate(payload);
    };

    const handleProductChange = (productId: string) => {
        const product = productList.find((item) => item.id === productId);
        patchForm({ productId, ...(product && { unitPrice: String(toAmount(product.price)) }) });
    };

    const renderModal = () => {
        if (modalState === 'client') {
            return (
                <PosClientPickerModal
                    selectedId={form?.client?.id}
                    onSelect={(client) => patchForm({ client })}
                />
            );
        }
        if (modalState === 'renew' && subscription) {
            return (
                <PosRenewSubscriptionModal
                    subscription={subscription}
                    onSubmit={async (startDate) => {
                        await renewMutation.mutateAsync(startDate).catch(() => undefined);
                    }}
                    isLoading={renewMutation.isPending}
                />
            );
        }
        if (modalState === 'cancel') {
            return (
                <ConfirmationModal
                    title={t('cancel')}
                    description={t('cancelConfirm')}
                    submitBtnText={t('cancel')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => cancelMutation.mutate()}
                    isLoading={cancelMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        if (modalState === 'delete') {
            return (
                <ConfirmationModal
                    title={tCommon('delete')}
                    description={t('deleteConfirm')}
                    submitBtnText={tCommon('delete')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => deleteMutation.mutate()}
                    isLoading={deleteMutation.isPending}
                    icon={IconComponentsEnum.info}
                    iconBgColor="bg-danger-100"
                    iconColor="text-danger-600"
                />
            );
        }
        return null;
    };

    const backButton = (
        <Button
            id="subscription-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.subscriptions)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    const busy =
        saveMutation.isPending ||
        activateMutation.isPending ||
        renewMutation.isPending ||
        invoiceMutation.isPending ||
        cancelMutation.isPending;
    const title = subscription ? formatSubscriptionNumber(subscription.number) : t('newTitle');

    const actionButtons = (
        <Div className="flex flex-wrap gap-2">
            {!isNew && status === 'DRAFT' ? (
                <Button
                    id="subscription-activate"
                    type={dirty ? EButtonType.secondary : EButtonType.primary}
                    size={EButtonSize.small}
                    text={t('activate')}
                    isLoading={activateMutation.isPending}
                    disabled={busy}
                    onClick={handleActivate}
                />
            ) : null}
            {status === 'ACTIVE' && !activeInvoice ? (
                <Button
                    id="subscription-invoice"
                    type={EButtonType.primary}
                    size={EButtonSize.small}
                    text={t('createInvoice')}
                    isLoading={invoiceMutation.isPending}
                    disabled={busy}
                    onClick={() => invoiceMutation.mutate()}
                />
            ) : null}
            {status === 'ACTIVE' && !subscription?.renewal ? (
                <Button
                    id="subscription-renew"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.rotate, size: ESize.sm, color: 'text-primary-500' }}
                    text={t('renew')}
                    isLoading={renewMutation.isPending}
                    disabled={busy}
                    onClick={() => open('renew')}
                />
            ) : null}
            {subscription && status !== 'CANCELLED' && !hasPostedInvoice ? (
                <Button
                    id="subscription-cancel"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    text={t('cancel')}
                    disabled={busy}
                    onClick={() => open('cancel')}
                />
            ) : null}
            {subscription && isAdmin && (status === 'DRAFT' || status === 'CANCELLED') ? (
                <Button
                    id="subscription-delete"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                    text={tCommon('delete')}
                    disabled={busy}
                    onClick={() => open('delete')}
                />
            ) : null}
        </Div>
    );

    const pipelineSteps = [
        { key: 'DRAFT', label: t('statusDRAFT') },
        { key: 'ACTIVE', label: t('statusACTIVE') },
        { key: 'EXPIRED', label: t('statusEXPIRED') },
    ];

    const productOptions = productList.map((product) => ({ value: product.id, label: product.name }));
    if (subscription && form?.productId && !productOptions.some((option) => option.value === form.productId)) {
        productOptions.unshift({ value: form.productId, label: subscription.productName });
    }

    const durationLabel = selectedProduct?.subscriptionDuration && selectedProduct.subscriptionUnit
        ? tProducts('durationValue', {
              count: selectedProduct.subscriptionDuration,
              unit: tProducts(`unit${selectedProduct.subscriptionUnit}`),
          })
        : subscription
          ? tProducts('durationValue', { count: subscription.duration, unit: tProducts(`unit${subscription.unit}`) })
          : '—';
    let productHint: string | undefined;
    if (productList.length === 0) productHint = t('noSubscriptionProducts');
    else if (selectedProduct) productHint = t('durationHint', { value: durationLabel });

    const loading = !form || (!isNew && (isLoading || !subscription));

    return (
        <>
            {modalPortal(renderModal())}
            <LayoutWrapper
                title={t('title')}
                subTitle={title}
                leftActions={backButton}
                mainSection={
                    loading || !form || !preview ? (
                        <Div className="flex min-h-48 items-center justify-center py-16">
                            <Spinner color="text-primary-500" size={ESize.lg} />
                        </Div>
                    ) : (
                        <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <Div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
                                {actionButtons}
                                {status === 'CANCELLED' ? (
                                    <Badge
                                        id="subscription-status"
                                        text={t('statusCANCELLED')}
                                        type={SUBSCRIPTION_STATUS_BADGE.CANCELLED}
                                        size={EBadgeSize.medium}
                                    />
                                ) : (
                                    <PosStatusPipeline
                                        steps={pipelineSteps}
                                        active={displayStatus === 'EXPIRING' ? 'ACTIVE' : displayStatus}
                                    />
                                )}
                            </Div>

                            {subscription ? (
                                <Div className="flex flex-col justify-end border-b border-gray-100 sm:flex-row">
                                    {subscription.renewedFrom ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.arrowLeft}
                                            value={formatSubscriptionNumber(subscription.renewedFrom.number)}
                                            label={t('renewedFromStat')}
                                            onClick={() => router.push(Routes.Pos.subscription(subscription.renewedFrom!.id))}
                                        />
                                    ) : null}
                                    {subscription.renewal ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.rotate}
                                            value={formatSubscriptionNumber(subscription.renewal.number)}
                                            label={t('renewalStat')}
                                            onClick={() => router.push(Routes.Pos.subscription(subscription.renewal!.id))}
                                        />
                                    ) : null}
                                    <PosStatButton
                                        icon={IconComponentsEnum.filetext}
                                        value={String(subscription.invoices.length)}
                                        label={t('invoicesStat')}
                                        onClick={
                                            subscription.invoices.length > 0
                                                ? () =>
                                                      router.push(
                                                          Routes.Pos.invoice((activeInvoice ?? subscription.invoices[0]).id),
                                                      )
                                                : undefined
                                        }
                                    />
                                </Div>
                            ) : null}

                            <Div className="space-y-6 px-6 py-5">
                                <Div className="flex flex-wrap items-center gap-3">
                                    <Label variant={EVariantLabel.h3} color="text-gray-900">
                                        {title}
                                    </Label>
                                    {subscription && (displayStatus === 'EXPIRING' || displayStatus === 'EXPIRED') ? (
                                        <Badge
                                            id="subscription-period-status"
                                            text={t(`status${displayStatus}`)}
                                            type={SUBSCRIPTION_STATUS_BADGE[displayStatus]}
                                            size={EBadgeSize.small}
                                        />
                                    ) : null}
                                </Div>

                                {editable ? (
                                    <Div className="grid items-start gap-x-6 gap-y-4 sm:grid-cols-2">
                                        <Div className="flex flex-col">
                                            <Label className="mb-1.5" variant={EVariantLabel.bodySmall} color="text-gray-900">
                                                {t('client')}
                                                <Label color="text-primary-500" className="align-middle" variant={EVariantLabel.bodySmall}>
                                                    *
                                                </Label>
                                            </Label>
                                            <Button
                                                id="subscription-client"
                                                type={EButtonType.secondary}
                                                size={EButtonSize.medium}
                                                iconPosition="left"
                                                icon={{
                                                    name: IconComponentsEnum.user,
                                                    size: ESize.sm,
                                                    color: showErrors && !form.client ? 'text-danger-600' : 'text-primary-500',
                                                }}
                                                text={form.client ? personName(form.client) : t('pickClient')}
                                                onClick={() => open('client')}
                                                className="w-full justify-start"
                                            />
                                        </Div>
                                        <Dropdown
                                            label={t('product')}
                                            placeholder={t('pickProduct')}
                                            options={productOptions}
                                            value={form.productId}
                                            onChange={(value) => handleProductChange(String(value))}
                                            searchable
                                            required
                                            error={showErrors && !form.productId}
                                            hintText={productHint}
                                        />
                                        <Input
                                            id="subscription-start"
                                            label={t('startDate')}
                                            type={EInputType.date}
                                            value={form.startDate}
                                            onChange={(e) => patchForm({ startDate: e.target.value })}
                                            required
                                            error={showErrors && !form.startDate}
                                        />
                                        <Input
                                            id="subscription-end"
                                            label={t('endDate')}
                                            type={EInputType.date}
                                            value={preview.endDate}
                                            readOnly
                                            disabled
                                            hintText={t('endDateHint')}
                                        />
                                        <Input
                                            id="subscription-price"
                                            label={t('unitPrice')}
                                            type={EInputType.number}
                                            value={form.unitPrice}
                                            onChange={(e) => patchForm({ unitPrice: e.target.value })}
                                            required
                                        />
                                        <Input
                                            id="subscription-discount"
                                            label={t('discountPct')}
                                            type={EInputType.number}
                                            value={form.discountPct}
                                            onChange={(e) => patchForm({ discountPct: e.target.value })}
                                        />
                                    </Div>
                                ) : (
                                    <Div className="grid gap-x-10 gap-y-3 lg:grid-cols-2">
                                        <Div className="space-y-3">
                                            <PosInfoRow label={t('client')} value={personName(subscription?.client)} />
                                            {subscription?.client.phone ? (
                                                <PosInfoRow label={t('phone')} value={subscription.client.phone} />
                                            ) : null}
                                            <PosInfoRow label={t('product')} value={subscription?.productName ?? '—'} />
                                            <PosInfoRow label={t('duration')} value={durationLabel} />
                                        </Div>
                                        <Div className="space-y-3">
                                            <PosInfoRow label={t('startDate')} value={formatPosDate(subscription?.startDate)} />
                                            <PosInfoRow label={t('endDate')} value={formatPosDate(subscription?.endDate)} />
                                            <PosInfoRow
                                                label={t('unitPrice')}
                                                value={formatMoney(toAmount(subscription?.unitPrice))}
                                            />
                                            {toAmount(subscription?.discountPct) > 0 ? (
                                                <PosInfoRow
                                                    label={t('discountPct')}
                                                    value={`${toAmount(subscription?.discountPct)} %`}
                                                />
                                            ) : null}
                                        </Div>
                                    </Div>
                                )}

                                <Div className="flex justify-end">
                                    <Div className="w-full max-w-xs space-y-1 border-t border-gray-100 pt-3">
                                        <PosInfoRow label={t('untaxed')} value={formatMoney(preview.subtotal)} />
                                        <PosInfoRow
                                            label={t('taxValue', { rate: preview.taxRate })}
                                            value={formatMoney(preview.taxAmount)}
                                        />
                                        <Div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                            <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                                                {t('total')}
                                            </Label>
                                            <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="tabular-nums">
                                                {formatMoney(preview.total)}
                                            </Label>
                                        </Div>
                                        {subscription && toAmount(subscription.amountPaid) > 0 ? (
                                            <>
                                                <PosInfoRow
                                                    label={t('paidAtRegister')}
                                                    value={formatMoney(toAmount(subscription.amountPaid))}
                                                />
                                                <PosInfoRow
                                                    label={t('amountDue')}
                                                    value={formatMoney(
                                                        round3(toAmount(subscription.total) - toAmount(subscription.amountPaid)),
                                                    )}
                                                />
                                            </>
                                        ) : null}
                                    </Div>
                                </Div>

                                {editable ? (
                                    <Input
                                        id="subscription-note"
                                        label={t('note')}
                                        isTextArea
                                        rows={3}
                                        value={form.note}
                                        onChange={(e) => patchForm({ note: e.target.value })}
                                    />
                                ) : subscription?.note ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block whitespace-pre-line">
                                        {subscription.note}
                                    </Label>
                                ) : null}
                            </Div>

                            {editable ? (
                                <PosFormFooter
                                    id="subscription"
                                    onCancel={() => router.push(Routes.Pos.subscriptions)}
                                    onSave={handleSave}
                                    isSaving={saveMutation.isPending}
                                    disabled={busy || !(isNew || dirty)}
                                />
                            ) : null}
                        </Div>
                    )
                }
            />
        </>
    );
}

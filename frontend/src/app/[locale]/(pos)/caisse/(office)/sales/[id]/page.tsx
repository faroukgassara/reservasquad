'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import PosClientPickerModal from '@/components/Modals/PosClientPickerModal/PosClientPickerModal';
import OrganismPosDocumentLines from '@/components/Organisms/Pos/OrganismPosDocumentLines';
import PosFormFooter from '@/components/Organisms/Pos/PosFormFooter';
import PosInfoRow from '@/components/Organisms/Pos/PosInfoRow';
import PosStatButton from '@/components/Organisms/Pos/PosStatButton';
import PosStatusPipeline from '@/components/Organisms/Pos/PosStatusPipeline';
import Badge from '@/components/Primitives/Badge/Badge';
import DatePickerField from '@/components/Primitives/DatePicker/DatePickerField';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { usePosPdfLabels } from '@/hooks/usePosPdfLabels';
import { formatMoney } from '@/lib/daily-income-api';
import {
    cancelSaleOrder,
    confirmSaleOrder,
    createInvoiceFromSaleOrder,
    createSaleOrder,
    deleteSaleOrder,
    fetchPosProducts,
    fetchSaleOrder,
    formatPosDate,
    formatSaleNumber,
    personName,
    toAmount,
    toDateInput,
    updateSaleOrder,
    type PosClientRef,
    type SaleOrderDetail,
    type SaleOrderInput,
} from '@/lib/pos-api';
import {
    SALE_STATUS_BADGE,
    draftFromLine,
    draftToInput,
    isDraftValid,
    newDraftLine,
    type DocumentLineDraft,
} from '@/lib/pos-documents';
import { printSaleOrderPdf } from '@/lib/pos-documents-pdf';
import { Routes } from '@/lib/routes';
import {
    EBadgeSize,
    EButtonSize,
    EButtonType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';

interface SaleForm {
    client: PosClientRef | null;
    validUntil: string;
    note: string;
    lines: DocumentLineDraft[];
}

type ModalState = 'client' | 'cancel' | 'delete' | null;
type SaleAction = 'confirm' | 'cancel';

function formFromOrder(order: SaleOrderDetail): SaleForm {
    return {
        client: order.client,
        validUntil: toDateInput(order.validUntil),
        note: order.note ?? '',
        lines: order.lines.map(draftFromLine),
    };
}

export default function PosSaleOrderPage() {
    const t = useTranslations('pos.sales');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const orderId = params.id;
    const isNew = orderId === 'new';
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const pdfLabels = usePosPdfLabels();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [modalState, setModalState] = useState<ModalState>(null);
    const { openModal, closeModal, modalPortal } = useModal({ closeCallBack: () => setModalState(null) });
    const [form, setForm] = useState<SaleForm | null>(() =>
        isNew ? { client: null, validUntil: '', note: '', lines: [newDraftLine()] } : null,
    );
    const [dirty, setDirty] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const { data: order, isLoading } = useQuery({
        queryKey: ['sale-order', orderId],
        queryFn: () => fetchSaleOrder(orderId),
        enabled: !isNew,
    });

    const { data: products } = useQuery({
        queryKey: ['pos-products', 'documents'],
        queryFn: () => fetchPosProducts({ page: 1, perPage: 100 }),
    });

    useEffect(() => {
        if (!order) return;
        setForm(formFromOrder(order));
        setDirty(false);
        setShowErrors(false);
    }, [order]);

    const status = order?.status ?? 'DRAFT';
    const editable = isNew || status === 'DRAFT' || status === 'SENT';
    const activeInvoice = order?.invoices.find((invoice) => invoice.type === 'INVOICE' && invoice.status !== 'CANCELLED');

    const patchForm = (patch: Partial<SaleForm>) => {
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
        void queryClient.invalidateQueries({ queryKey: ['sale-order', orderId] });
        void queryClient.invalidateQueries({ queryKey: ['sale-orders'] });
    };

    const buildPayload = (): SaleOrderInput | null => {
        if (!form) return null;
        const valid = !!form.client && form.lines.length > 0 && form.lines.every(isDraftValid);
        if (!valid) {
            setShowErrors(true);
            openToast(tCommon('error'), form.client ? t('invalidLines') : t('clientRequired'), {
                type: EToastType.ERROR,
            });
            return null;
        }
        return {
            clientId: form.client!.id,
            validUntil: form.validUntil || null,
            note: form.note.trim() || null,
            lines: form.lines.map(draftToInput),
        };
    };

    const saveMutation = useMutation({
        mutationFn: (payload: SaleOrderInput) => (isNew ? createSaleOrder(payload) : updateSaleOrder(orderId, payload)),
        onSuccess: (saved) => {
            void queryClient.invalidateQueries({ queryKey: ['sale-orders'] });
            openToast(tCommon('success'), t('saved'), { type: EToastType.SUCCESS });
            if (isNew) {
                router.replace(Routes.Pos.sale(saved.id));
                return;
            }
            refresh();
        },
        onError,
    });

    const actionMutation = useMutation({
        mutationFn: async ({ action, payload }: { action: SaleAction; payload: SaleOrderInput | null }) => {
            if (payload) await updateSaleOrder(orderId, payload);
            if (action === 'confirm') return confirmSaleOrder(orderId);
            return cancelSaleOrder(orderId);
        },
        onSuccess: (_, { action }) => {
            refresh();
            const messages = { confirm: t('confirmed'), cancel: t('cancelled') };
            openToast(tCommon('success'), messages[action], { type: EToastType.SUCCESS });
            closeModal();
        },
        onError,
    });

    const invoiceMutation = useMutation({
        mutationFn: () => createInvoiceFromSaleOrder(orderId),
        onSuccess: (invoice) => {
            refresh();
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            router.push(Routes.Pos.invoice(invoice.id));
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteSaleOrder(orderId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['sale-orders'] });
            closeModal();
            router.push(Routes.Pos.sales);
        },
        onError,
    });

    const handleSave = () => {
        const payload = buildPayload();
        if (payload) saveMutation.mutate(payload);
    };

    const runAction = (action: SaleAction) => {
        let payload: SaleOrderInput | null = null;
        if (action !== 'cancel' && dirty) {
            payload = buildPayload();
            if (!payload) return;
        }
        actionMutation.mutate({ action, payload });
    };

    const handlePrint = () => {
        if (!order) return;
        void printSaleOrderPdf(order, pdfLabels).catch(onError);
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
        if (modalState === 'cancel') {
            return (
                <ConfirmationModal
                    title={t('cancel')}
                    description={t('cancelConfirm')}
                    submitBtnText={t('cancel')}
                    cancelBtnText={tCommon('cancel')}
                    onSubmit={() => runAction('cancel')}
                    isLoading={actionMutation.isPending}
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
            id="sale-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.sales)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    const busy = saveMutation.isPending || actionMutation.isPending || invoiceMutation.isPending;
    const amountPaid = toAmount(order?.amountPaid);
    const title = order ? formatSaleNumber(order.number) : t('newTitle');

    const actionButtons = (
        <Div className="flex flex-wrap gap-2">
            {!isNew && editable ? (
                <Button
                    id="sale-confirm"
                    type={dirty ? EButtonType.secondary : EButtonType.primary}
                    size={EButtonSize.small}
                    text={t('confirm')}
                    disabled={busy}
                    onClick={() => runAction('confirm')}
                />
            ) : null}
            {status === 'CONFIRMED' && !activeInvoice ? (
                <Button
                    id="sale-invoice"
                    type={EButtonType.primary}
                    size={EButtonSize.small}
                    text={t('createInvoice')}
                    isLoading={invoiceMutation.isPending}
                    disabled={busy}
                    onClick={() => invoiceMutation.mutate()}
                />
            ) : null}
            {order ? (
                <Button
                    id="sale-print"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.printer, size: ESize.sm, color: 'text-primary-500' }}
                    text={t('print')}
                    disabled={dirty}
                    onClick={handlePrint}
                />
            ) : null}
            {order && status !== 'CANCELLED' && amountPaid === 0 ? (
                <Button
                    id="sale-cancel"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    text={t('cancel')}
                    disabled={busy}
                    onClick={() => open('cancel')}
                />
            ) : null}
            {order && isAdmin && (status === 'DRAFT' || status === 'CANCELLED') ? (
                <Button
                    id="sale-delete"
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
        ...(status === 'SENT' ? [{ key: 'SENT', label: t('statusSENT') }] : []),
        { key: 'CONFIRMED', label: t('statusCONFIRMED') },
    ];

    const loading = !form || (!isNew && (isLoading || !order));

    return (
        <>
            {modalPortal(renderModal())}
            <LayoutWrapper
                title={t('title')}
                subTitle={title}
                leftActions={backButton}
                mainSection={
                    loading || !form ? (
                        <Div className="flex min-h-48 items-center justify-center py-16">
                            <Spinner color="text-primary-500" size={ESize.lg} />
                        </Div>
                    ) : (
                        <Div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <Div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                                {actionButtons}
                                {status === 'CANCELLED' ? (
                                    <Badge
                                        id="sale-status"
                                        text={t('statusCANCELLED')}
                                        type={SALE_STATUS_BADGE.CANCELLED}
                                        size={EBadgeSize.medium}
                                    />
                                ) : (
                                    <PosStatusPipeline steps={pipelineSteps} active={status} />
                                )}
                            </Div>

                            {order ? (
                                <Div className="flex flex-col justify-end border-b border-gray-100 sm:flex-row">
                                    <PosStatButton
                                        icon={IconComponentsEnum.filetext}
                                        value={String(order.invoices.length)}
                                        label={t('invoicesStat')}
                                        onClick={
                                            order.invoices.length > 0
                                                ? () =>
                                                      router.push(
                                                          Routes.Pos.invoice((activeInvoice ?? order.invoices[0]).id),
                                                      )
                                                : undefined
                                        }
                                    />
                                    <PosStatButton
                                        icon={IconComponentsEnum.checkCircle}
                                        value={formatMoney(amountPaid)}
                                        label={t('paidStat')}
                                    />
                                </Div>
                            ) : null}

                            <Div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
                                <Label variant={EVariantLabel.h3} color="text-gray-900" className="break-all">
                                    {title}
                                </Label>

                                <Div className="grid gap-x-10 gap-y-3 lg:grid-cols-2">
                                    <Div className="space-y-3">
                                        {editable ? (
                                            <Div className="space-y-1">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                                                    {t('client')}
                                                </Label>
                                                <Button
                                                    id="sale-client"
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
                                        ) : (
                                            <PosInfoRow label={t('client')} value={personName(order?.client)} />
                                        )}
                                        {order?.client.phone ? (
                                            <PosInfoRow label={t('phone')} value={order.client.phone} />
                                        ) : null}
                                    </Div>
                                    <Div className="space-y-3">
                                        {editable ? (
                                            <DatePickerField
                                                id="sale-valid-until"
                                                label={t('validUntil')}
                                                value={form.validUntil}
                                                onChange={(validUntil) => patchForm({ validUntil })}
                                            />
                                        ) : (
                                            <PosInfoRow
                                                label={t('validUntil')}
                                                value={order?.validUntil ? formatPosDate(order.validUntil) : '—'}
                                            />
                                        )}
                                        {order ? (
                                            <>
                                                <PosInfoRow label={t('date')} value={formatPosDate(order.orderDate)} />
                                                <PosInfoRow
                                                    label={t('salesperson')}
                                                    value={personName(order.salesperson)}
                                                />
                                            </>
                                        ) : null}
                                    </Div>
                                </Div>

                                <OrganismPosDocumentLines
                                    lines={form.lines}
                                    onChange={(lines) => patchForm({ lines })}
                                    products={products?.data ?? []}
                                    amountPaid={order ? amountPaid : undefined}
                                    readOnly={!editable}
                                    showErrors={showErrors}
                                />

                                {editable ? (
                                    <Input
                                        id="sale-note"
                                        label={t('note')}
                                        isTextArea
                                        rows={3}
                                        value={form.note}
                                        onChange={(e) => patchForm({ note: e.target.value })}
                                    />
                                ) : order?.note ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block whitespace-pre-line">
                                        {order.note}
                                    </Label>
                                ) : null}
                            </Div>

                            {editable ? (
                                <PosFormFooter
                                    id="sale"
                                    onCancel={() => router.push(Routes.Pos.sales)}
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

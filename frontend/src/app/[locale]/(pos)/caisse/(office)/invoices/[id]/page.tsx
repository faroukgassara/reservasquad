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
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import Toggle from '@/components/Primitives/Toggle/Toggle';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { usePosPdfLabels } from '@/hooks/usePosPdfLabels';
import { formatMoney } from '@/lib/daily-income-api';
import {
    cancelInvoice,
    createCreditNote,
    createInvoice,
    deleteInvoice,
    deleteInvoicePayment,
    fetchInvoice,
    fetchPosProducts,
    formatInvoiceNumber,
    formatPosDate,
    formatSaleNumber,
    formatSubscriptionNumber,
    personName,
    postInvoice,
    resetInvoiceToDraft,
    STAMP_DUTY,
    toAmount,
    toDateInput,
    todayInput,
    updateInvoice,
    type InvoiceDetail,
    type InvoiceInput,
    type InvoicePayment,
    type PosClientRef,
} from '@/lib/pos-api';
import {
    INVOICE_STATUS_BADGE,
    PAYMENT_STATE_BADGE,
    draftFromLine,
    draftToInput,
    isDraftValid,
    newDraftLine,
    type DocumentLineDraft,
} from '@/lib/pos-documents';
import { printInvoicePdf } from '@/lib/pos-documents-pdf';
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

interface InvoiceForm {
    client: PosClientRef | null;
    invoiceDate: string;
    dueDate: string;
    note: string;
    withStampDuty: boolean;
    lines: DocumentLineDraft[];
}

type InvoiceAction = 'post' | 'draft' | 'cancel' | 'credit-note';

type ModalState =
    | { type: 'client' }
    | { type: 'cancel' }
    | { type: 'delete' }
    | { type: 'payment-delete'; payment: InvoicePayment }
    | null;

function formFromInvoice(invoice: InvoiceDetail): InvoiceForm {
    return {
        client: invoice.client,
        invoiceDate: toDateInput(invoice.invoiceDate),
        dueDate: toDateInput(invoice.dueDate),
        note: invoice.note ?? '',
        withStampDuty: toAmount(invoice.stampDuty) > 0,
        lines: invoice.lines.map(draftFromLine),
    };
}

export default function PosInvoicePage() {
    const t = useTranslations('pos.invoices');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const invoiceId = params.id;
    const isNew = invoiceId === 'new';
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const pdfLabels = usePosPdfLabels();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });
    const [modalState, setModalState] = useState<ModalState>(null);
    const { openModal, closeModal, modalPortal } = useModal({ closeCallBack: () => setModalState(null) });
    const [form, setForm] = useState<InvoiceForm | null>(() =>
        isNew
            ? {
                  client: null,
                  invoiceDate: todayInput(),
                  dueDate: '',
                  note: '',
                  withStampDuty: true,
                  lines: [newDraftLine()],
              }
            : null,
    );
    const [dirty, setDirty] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: () => fetchInvoice(invoiceId),
        enabled: !isNew,
    });

    const { data: products } = useQuery({
        queryKey: ['pos-products', 'documents'],
        queryFn: () => fetchPosProducts({ page: 1, perPage: 100 }),
    });

    useEffect(() => {
        if (!invoice) return;
        setForm(formFromInvoice(invoice));
        setDirty(false);
        setShowErrors(false);
    }, [invoice]);

    const status = invoice?.status ?? 'DRAFT';
    const editable = isNew || status === 'DRAFT';
    const isCreditNote = invoice?.type === 'CREDIT_NOTE';
    const amountPaid = toAmount(invoice?.amountPaid);
    const hasPayments = (invoice?.payments.length ?? 0) > 0;

    const patchForm = (patch: Partial<InvoiceForm>) => {
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
        void queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
        void queryClient.invalidateQueries({ queryKey: ['invoices'] });
        void queryClient.invalidateQueries({ queryKey: ['sale-order'] });
    };

    const buildPayload = (): InvoiceInput | null => {
        if (!form) return null;
        const valid = !!form.client && !!form.invoiceDate && form.lines.length > 0 && form.lines.every(isDraftValid);
        if (!valid) {
            setShowErrors(true);
            openToast(tCommon('error'), form.client ? t('invalidLines') : t('clientRequired'), {
                type: EToastType.ERROR,
            });
            return null;
        }
        return {
            clientId: form.client!.id,
            invoiceDate: form.invoiceDate,
            dueDate: form.dueDate || null,
            note: form.note.trim() || null,
            withStampDuty: form.withStampDuty,
            lines: form.lines.map(draftToInput),
        };
    };

    const saveMutation = useMutation({
        mutationFn: (payload: InvoiceInput) => (isNew ? createInvoice(payload) : updateInvoice(invoiceId, payload)),
        onSuccess: (saved) => {
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            openToast(tCommon('success'), t('saved'), { type: EToastType.SUCCESS });
            if (isNew) {
                router.replace(Routes.Pos.invoice(saved.id));
                return;
            }
            refresh();
        },
        onError,
    });

    const actionMutation = useMutation({
        mutationFn: async ({ action, payload }: { action: InvoiceAction; payload: InvoiceInput | null }) => {
            if (payload) await updateInvoice(invoiceId, payload);
            if (action === 'post') return postInvoice(invoiceId);
            if (action === 'draft') return resetInvoiceToDraft(invoiceId);
            if (action === 'credit-note') return createCreditNote(invoiceId);
            return cancelInvoice(invoiceId);
        },
        onSuccess: (result, { action }) => {
            refresh();
            closeModal();
            if (action === 'credit-note') {
                router.push(Routes.Pos.invoice(result.id));
                return;
            }
            const messages = { post: t('posted'), draft: t('resetDone'), cancel: t('cancelled') };
            openToast(tCommon('success'), messages[action], { type: EToastType.SUCCESS });
        },
        onError,
    });

    const deletePaymentMutation = useMutation({
        mutationFn: deleteInvoicePayment,
        onSuccess: () => {
            refresh();
            closeModal();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteInvoice(invoiceId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            closeModal();
            router.push(Routes.Pos.invoices);
        },
        onError,
    });

    const handleSave = () => {
        const payload = buildPayload();
        if (payload) saveMutation.mutate(payload);
    };

    const runAction = (action: InvoiceAction) => {
        let payload: InvoiceInput | null = null;
        if (action === 'post' && dirty) {
            payload = buildPayload();
            if (!payload) return;
        }
        actionMutation.mutate({ action, payload });
    };

    const handlePrint = () => {
        if (!invoice) return;
        void printInvoicePdf(invoice, pdfLabels).catch(onError);
    };

    const confirmation = (title: string, description: string, onSubmit: () => void, loading: boolean) => (
        <ConfirmationModal
            title={title}
            description={description}
            submitBtnText={title}
            cancelBtnText={tCommon('cancel')}
            onSubmit={onSubmit}
            isLoading={loading}
            icon={IconComponentsEnum.info}
            iconBgColor="bg-danger-100"
            iconColor="text-danger-600"
        />
    );

    const renderModal = () => {
        switch (modalState?.type) {
            case 'client':
                return (
                    <PosClientPickerModal selectedId={form?.client?.id} onSelect={(client) => patchForm({ client })} />
                );
            case 'cancel':
                return confirmation(
                    t('cancel'),
                    t('cancelConfirm'),
                    () => runAction('cancel'),
                    actionMutation.isPending,
                );
            case 'delete':
                return confirmation(
                    tCommon('delete'),
                    t('deleteConfirm'),
                    () => deleteMutation.mutate(),
                    deleteMutation.isPending,
                );
            case 'payment-delete':
                return confirmation(
                    tCommon('delete'),
                    t('deletePaymentConfirm'),
                    () => deletePaymentMutation.mutate(modalState.payment.id),
                    deletePaymentMutation.isPending,
                );
            default:
                return null;
        }
    };

    const backButton = (
        <Button
            id="invoice-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.invoices)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    const busy = saveMutation.isPending || actionMutation.isPending || deletePaymentMutation.isPending;

    let title = t('newTitle');
    if (invoice) {
        const prefix = isCreditNote ? t('typeCREDIT_NOTE') : t('typeINVOICE');
        title = invoice.displayNumber === '/' ? `${prefix} ${t('draftNumber')}` : `${prefix} ${invoice.displayNumber}`;
    }

    const actionButtons = (
        <Div className="flex flex-wrap gap-2">
            {!isNew && status === 'DRAFT' ? (
                <Button
                    id="invoice-post"
                    type={dirty ? EButtonType.secondary : EButtonType.primary}
                    size={EButtonSize.small}
                    text={t('post')}
                    disabled={busy}
                    onClick={() => runAction('post')}
                />
            ) : null}
            {status === 'POSTED' && !isCreditNote ? (
                <Button
                    id="invoice-credit-note"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    text={t('addCreditNote')}
                    disabled={busy}
                    onClick={() => runAction('credit-note')}
                />
            ) : null}
            {invoice ? (
                <Button
                    id="invoice-print"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.printer, size: ESize.sm, color: 'text-primary-500' }}
                    text={t('print')}
                    disabled={dirty}
                    onClick={handlePrint}
                />
            ) : null}
            {invoice && status !== 'DRAFT' && !hasPayments ? (
                <Button
                    id="invoice-reset"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    text={t('resetToDraft')}
                    disabled={busy}
                    onClick={() => runAction('draft')}
                />
            ) : null}
            {invoice && status !== 'CANCELLED' && !hasPayments ? (
                <Button
                    id="invoice-cancel"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    text={t('cancel')}
                    disabled={busy}
                    onClick={() => open({ type: 'cancel' })}
                />
            ) : null}
            {invoice && isAdmin && status !== 'POSTED' && !hasPayments ? (
                <Button
                    id="invoice-delete"
                    type={EButtonType.secondary}
                    size={EButtonSize.small}
                    iconPosition="left"
                    icon={{ name: IconComponentsEnum.trash, size: ESize.sm, color: 'text-danger-600' }}
                    text={tCommon('delete')}
                    disabled={busy}
                    onClick={() => open({ type: 'delete' })}
                />
            ) : null}
        </Div>
    );

    const pipelineSteps = [
        { key: 'DRAFT', label: t('statusDRAFT') },
        { key: 'POSTED', label: t('statusPOSTED') },
    ];

    const stampDuty = editable
        ? form?.withStampDuty
            ? STAMP_DUTY
            : 0
        : toAmount(invoice?.stampDuty);

    const loading = !form || (!isNew && (isLoading || !invoice));

    const creditNote = invoice?.creditNotes.find((note) => note.status !== 'CANCELLED') ?? invoice?.creditNotes[0];

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
                            <Div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
                                {actionButtons}
                                {status === 'CANCELLED' ? (
                                    <Badge
                                        id="invoice-status"
                                        text={t('statusCANCELLED')}
                                        type={INVOICE_STATUS_BADGE.CANCELLED}
                                        size={EBadgeSize.medium}
                                    />
                                ) : (
                                    <PosStatusPipeline steps={pipelineSteps} active={status} />
                                )}
                            </Div>

                            {invoice && (invoice.saleOrder || invoice.subscription || invoice.reversedInvoice || creditNote) ? (
                                <Div className="flex flex-col justify-end border-b border-gray-100 sm:flex-row">
                                    {invoice.subscription ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.calendar}
                                            value={formatSubscriptionNumber(invoice.subscription.number)}
                                            label={t('subscriptionStat')}
                                            onClick={() => router.push(Routes.Pos.subscription(invoice.subscription!.id))}
                                        />
                                    ) : null}
                                    {invoice.saleOrder ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.shoppingCart}
                                            value={formatSaleNumber(invoice.saleOrder.number)}
                                            label={t('saleOrderStat')}
                                            onClick={() => router.push(Routes.Pos.sale(invoice.saleOrder!.id))}
                                        />
                                    ) : null}
                                    {invoice.reversedInvoice ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.filetext}
                                            value={formatInvoiceNumber(
                                                invoice.reversedInvoice.type,
                                                invoice.reversedInvoice.year,
                                                invoice.reversedInvoice.sequence,
                                            )}
                                            label={t('originalInvoice')}
                                            onClick={() => router.push(Routes.Pos.invoice(invoice.reversedInvoice!.id))}
                                        />
                                    ) : null}
                                    {creditNote ? (
                                        <PosStatButton
                                            icon={IconComponentsEnum.rotate}
                                            value={String(invoice.creditNotes.length)}
                                            label={t('creditNotesStat')}
                                            onClick={() => router.push(Routes.Pos.invoice(creditNote.id))}
                                        />
                                    ) : null}
                                </Div>
                            ) : null}

                            <Div className="space-y-6 px-6 py-5">
                                <Div className="flex flex-wrap items-center gap-3">
                                    <Label variant={EVariantLabel.h3} color="text-gray-900">
                                        {title}
                                    </Label>
                                    {invoice?.status === 'POSTED' ? (
                                        <Badge
                                            id="invoice-payment-state"
                                            text={t(`payment${invoice.paymentState}`)}
                                            type={PAYMENT_STATE_BADGE[invoice.paymentState]}
                                            size={EBadgeSize.medium}
                                        />
                                    ) : null}
                                </Div>

                                <Div className="grid gap-x-10 gap-y-3 lg:grid-cols-2">
                                    <Div className="space-y-3">
                                        {editable ? (
                                            <Div className="space-y-1">
                                                <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-medium">
                                                    {t('client')}
                                                </Label>
                                                <Button
                                                    id="invoice-client"
                                                    type={EButtonType.secondary}
                                                    size={EButtonSize.medium}
                                                    iconPosition="left"
                                                    icon={{
                                                        name: IconComponentsEnum.user,
                                                        size: ESize.sm,
                                                        color: showErrors && !form.client ? 'text-danger-600' : 'text-primary-500',
                                                    }}
                                                    text={form.client ? personName(form.client) : t('pickClient')}
                                                    onClick={() => open({ type: 'client' })}
                                                    className="w-full justify-start"
                                                />
                                            </Div>
                                        ) : (
                                            <PosInfoRow label={t('client')} value={personName(invoice?.client)} />
                                        )}
                                        {invoice?.client.cin ? (
                                            <PosInfoRow label={t('clientCin')} value={invoice.client.cin} />
                                        ) : null}
                                        {invoice?.client.taxId ? (
                                            <PosInfoRow label={t('clientTaxId')} value={invoice.client.taxId} />
                                        ) : null}
                                        {editable ? (
                                            <Div className="flex items-center justify-between gap-3 pt-1">
                                                <Div className="flex flex-col">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                                        {t('withStampDuty')}
                                                    </Label>
                                                    <Label variant={EVariantLabel.caption} color="text-gray-500">
                                                        {t('withStampDutyHint', {
                                                            value: formatMoney(STAMP_DUTY),
                                                        })}
                                                    </Label>
                                                </Div>
                                                <Toggle
                                                    id="invoice-stamp-duty"
                                                    checked={form.withStampDuty}
                                                    onChange={(checked) => patchForm({ withStampDuty: checked })}
                                                />
                                            </Div>
                                        ) : null}
                                    </Div>
                                    <Div className="space-y-3">
                                        {editable ? (
                                            <Div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    id="invoice-date"
                                                    label={t('date')}
                                                    type={EInputType.date}
                                                    value={form.invoiceDate}
                                                    onChange={(e) => patchForm({ invoiceDate: e.target.value })}
                                                    error={showErrors && !form.invoiceDate}
                                                    required
                                                />
                                                <Input
                                                    id="invoice-due-date"
                                                    label={t('dueDate')}
                                                    type={EInputType.date}
                                                    value={form.dueDate}
                                                    onChange={(e) => patchForm({ dueDate: e.target.value })}
                                                />
                                            </Div>
                                        ) : (
                                            <>
                                                <PosInfoRow
                                                    label={t('date')}
                                                    value={formatPosDate(invoice?.invoiceDate)}
                                                />
                                                <PosInfoRow
                                                    label={t('dueDate')}
                                                    value={invoice?.dueDate ? formatPosDate(invoice.dueDate) : '—'}
                                                />
                                            </>
                                        )}
                                    </Div>
                                </Div>

                                <OrganismPosDocumentLines
                                    lines={form.lines}
                                    onChange={(lines) => patchForm({ lines })}
                                    products={products?.data ?? []}
                                    stampDuty={stampDuty}
                                    amountPaid={invoice ? amountPaid : undefined}
                                    readOnly={!editable}
                                    showErrors={showErrors}
                                />

                                {editable ? (
                                    <Input
                                        id="invoice-note"
                                        label={t('note')}
                                        isTextArea
                                        rows={3}
                                        value={form.note}
                                        onChange={(e) => patchForm({ note: e.target.value })}
                                    />
                                ) : invoice?.note ? (
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="block whitespace-pre-line">
                                        {invoice.note}
                                    </Label>
                                ) : null}

                                {invoice && invoice.payments.length > 0 ? (
                                    <Div className="space-y-2 border-t border-gray-100 pt-4">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block font-semibold">
                                            {t('payments')}
                                        </Label>
                                        {invoice.payments.map((payment) => (
                                            <Div
                                                key={payment.id}
                                                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                                            >
                                                <Div className="flex min-w-0 flex-col">
                                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">
                                                        {t('paidOn', {
                                                            date: formatPosDate(payment.date),
                                                            method: t(`method${payment.method}`),
                                                        })}
                                                    </Label>
                                                    {payment.note || payment.createdBy ? (
                                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="truncate">
                                                            {[payment.note, payment.createdBy ? personName(payment.createdBy) : null]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </Label>
                                                    ) : null}
                                                </Div>
                                                <Div className="flex items-center gap-3">
                                                    <Label
                                                        variant={EVariantLabel.bodySmall}
                                                        color="text-gray-900"
                                                        className="font-semibold tabular-nums"
                                                    >
                                                        {formatMoney(toAmount(payment.amount))}
                                                    </Label>
                                                    {isAdmin && !payment.posOrderLineId ? (
                                                        <Icon
                                                            name={IconComponentsEnum.trash}
                                                            size={ESize.sm}
                                                            color="text-gray-500"
                                                            className="cursor-pointer hover:opacity-70"
                                                            handleClick={() => open({ type: 'payment-delete', payment })}
                                                        />
                                                    ) : null}
                                                </Div>
                                            </Div>
                                        ))}
                                    </Div>
                                ) : null}
                            </Div>

                            {editable ? (
                                <PosFormFooter
                                    id="invoice"
                                    onCancel={() => router.push(Routes.Pos.invoices)}
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

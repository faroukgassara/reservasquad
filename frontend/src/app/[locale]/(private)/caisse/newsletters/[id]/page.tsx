'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import LayoutWrapper from '@/components/Layouts/LayoutWrapper';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import ConfirmationModal from '@/components/Modals/ConfirmationModal/ConfirmationModal';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import BrandLogo from '@/components/Primitives/BrandLogo/BrandLogo';
import NewsletterBodyEditor from '@/components/Newsletter/NewsletterBodyEditor';
import NewsletterRecipientPicker, { SelectedRecipient } from '@/components/Newsletter/NewsletterRecipientPicker';
import { useModal } from '@/contexts/ModalContext';
import { useToast } from '@/contexts/ToastContext';
import {
    createNewsletter,
    fetchAudienceCount,
    fetchNewsletter,
    sendNewsletter,
    sendTestNewsletter,
    updateNewsletter,
    type CreateNewsletterInput,
    type NewsletterAudience,
    type NewsletterCategory,
    type NewsletterRecipientRecord,
    type NewsletterStatus,
} from '@/lib/newsletter-api';
import { Routes } from '@/lib/routes';
import { sanitizeNewsletterHtml } from '@/lib/sanitize';
import {
    EBadgeSize,
    EBadgeType,
    EButtonSize,
    EButtonType,
    EInputSize,
    EInputType,
    ESize,
    EToastType,
    EVariantLabel,
    IconComponentsEnum,
} from '@/Enum/Enum';
import { ITableColumn } from '@/interfaces/Organisms/IOrganismTable/IOrganismTable';

const AUDIENCES = [
    { value: 'ALL_CLIENTS', labelKey: 'audience_ALL_CLIENTS' },
    { value: 'ALL_PROFESSORS', labelKey: 'audience_ALL_PROFESSORS' },
    { value: 'SPECIFIC_RECIPIENTS', labelKey: 'audience_SPECIFIC_RECIPIENTS' },
] as const;

const CATEGORIES = [
    { value: 'UPDATE', labelKey: 'category_UPDATE' },
    { value: 'PROMOTION', labelKey: 'category_PROMOTION' },
    { value: 'DIGEST', labelKey: 'category_DIGEST' },
    { value: 'EDITORIAL', labelKey: 'category_EDITORIAL' },
] as const;

function formatDateTime(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PosNewsletterDetailPage() {
    const t = useTranslations('pos.newsletters');
    const tCommon = useTranslations('common');
    const params = useParams<{ id: string }>();
    const id = params.id;
    const isNew = id === 'new';
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { isAllowed } = useAuthorization();
    const isAdmin = isAllowed({ anyRoles: ['ADMIN'] });

    useEffect(() => {
        if (sessionStatus !== 'loading' && !isAdmin) {
            router.replace(Routes.Pos.index);
        }
    }, [sessionStatus, isAdmin, router]);

    const queryClient = useQueryClient();
    const { openToast } = useToast();
    const { modalPortal, openModal, closeModal } = useModal();

    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
    const [specificRecipientsError, setSpecificRecipientsError] = useState<string | null>(null);

    // Fetch existing newsletter if not new
    const {
        data: newsletter,
        isLoading: isNewsletterLoading,
        error: newsletterError,
    } = useQuery({
        queryKey: ['newsletter', id],
        queryFn: () => fetchNewsletter(id),
        enabled: !isNew && isAdmin,
        refetchInterval: (query) => (query.state.data?.status === 'SENDING' ? 2500 : false),
    });

    const isReadOnly = !isNew && newsletter?.status !== 'DRAFT';

    // Live audience count
    const [selectedAudience, setSelectedAudience] = useState<NewsletterAudience>('ALL_CLIENTS');
    const { data: audienceCountData, isLoading: isAudienceCountLoading } = useQuery({
        queryKey: ['newsletter-audience-count', selectedAudience],
        queryFn: () => fetchAudienceCount(selectedAudience),
        enabled: selectedAudience !== 'SPECIFIC_RECIPIENTS',
    });

    // TanStack Form definition
    const form = useForm({
        defaultValues: {
            subject: '',
            preheader: '',
            body: '',
            ctaLabel: '',
            ctaUrl: '',
            category: 'UPDATE' as NewsletterCategory,
            audience: 'ALL_CLIENTS' as NewsletterAudience,
        },
        onSubmit: async ({ value }) => {
            if (value.audience === 'SPECIFIC_RECIPIENTS' && selectedRecipients.length === 0) {
                setSpecificRecipientsError(t('validation.specificRecipientsRequired'));
                openToast(tCommon('error'), t('validation.specificRecipientsRequired'), {
                    type: EToastType.ERROR,
                });
                return;
            }
            setSpecificRecipientsError(null);

            const payload: CreateNewsletterInput = {
                ...value,
                specificClientIds:
                    value.audience === 'SPECIFIC_RECIPIENTS'
                        ? selectedRecipients.filter((r) => r.type === 'CLIENT').map((r) => r.id)
                        : [],
                specificProfessorIds:
                    value.audience === 'SPECIFIC_RECIPIENTS'
                        ? selectedRecipients.filter((r) => r.type === 'PROFESSOR').map((r) => r.id)
                        : [],
                specificEmails:
                    value.audience === 'SPECIFIC_RECIPIENTS'
                        ? selectedRecipients.filter((r) => r.type === 'EMAIL').map((r) => r.email)
                        : [],
            };

            if (isNew) {
                createMutation.mutate(payload);
            } else {
                updateMutation.mutate(payload);
            }
        },
    });

    // Populate form when existing newsletter is loaded
    useEffect(() => {
        if (!newsletter || newsletter.status !== 'DRAFT') return;
        form.setFieldValue('subject', newsletter.subject);
        form.setFieldValue('preheader', newsletter.preheader || '');
        form.setFieldValue('body', newsletter.body);
        form.setFieldValue('ctaLabel', newsletter.ctaLabel || '');
        form.setFieldValue('ctaUrl', newsletter.ctaUrl || '');
        form.setFieldValue('category', newsletter.category);
        form.setFieldValue('audience', newsletter.audience);
        setSelectedAudience(newsletter.audience);

        if (newsletter.audience === 'SPECIFIC_RECIPIENTS') {
            const initialRecipients: SelectedRecipient[] = [];
            if (newsletter.specificClients && newsletter.specificClients.length > 0) {
                newsletter.specificClients.forEach((c) => {
                    initialRecipients.push({
                        id: c.id,
                        type: 'CLIENT',
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email,
                        phone: c.phone,
                    });
                });
            }
            if (newsletter.specificProfessors && newsletter.specificProfessors.length > 0) {
                newsletter.specificProfessors.forEach((p) => {
                    initialRecipients.push({
                        id: p.id,
                        type: 'PROFESSOR',
                        firstName: p.firstName,
                        lastName: p.lastName,
                        email: p.email,
                        phone: p.phone,
                    });
                });
            }
            if (newsletter.specificEmails && newsletter.specificEmails.length > 0) {
                newsletter.specificEmails.forEach((e) => {
                    initialRecipients.push({
                        id: `email-${e}`,
                        type: 'EMAIL',
                        email: e,
                    });
                });
            }
            setSelectedRecipients(initialRecipients);
        }
    }, [newsletter, form]);

    const createMutation = useMutation({
        mutationFn: (data: CreateNewsletterInput) => createNewsletter(data),
        onSuccess: (created) => {
            void queryClient.invalidateQueries({ queryKey: ['newsletters'] });
            openToast(tCommon('success'), t('saveSuccess'), { type: EToastType.SUCCESS });
            router.push(Routes.Pos.newsletter(created.id));
        },
        onError: (err: Error) => {
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: CreateNewsletterInput) => updateNewsletter(id, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
            void queryClient.invalidateQueries({ queryKey: ['newsletters'] });
            openToast(tCommon('success'), t('saveSuccess'), { type: EToastType.SUCCESS });
        },
        onError: (err: Error) => {
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR });
        },
    });

    const sendMutation = useMutation({
        mutationFn: () => sendNewsletter(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
            void queryClient.invalidateQueries({ queryKey: ['newsletters'] });
            openToast(tCommon('success'), t('sendSuccess'), { type: EToastType.SUCCESS });
            setIsSendConfirmOpen(false);
            closeModal();
        },
        onError: (err: Error) => {
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR });
        },
    });

    const testMutation = useMutation({
        mutationFn: (email: string) => sendTestNewsletter(id, email),
        onSuccess: ({ email }) => {
            openToast(tCommon('success'), t('testSuccess', { email }), { type: EToastType.SUCCESS });
            setIsTestModalOpen(false);
            setTestEmail('');
        },
        onError: (err: Error) => {
            openToast(tCommon('error'), err.message, { type: EToastType.ERROR });
        },
    });

    const statusBadge = (status: NewsletterStatus) => {
        switch (status) {
            case 'DRAFT':
                return <Badge id="newsletter-detail-draft" text={t('status_DRAFT')} type={EBadgeType.revprimary} size={EBadgeSize.medium} />;
            case 'SENDING':
                return <Badge id="newsletter-detail-sending" text={t('status_SENDING')} type={EBadgeType.warning} size={EBadgeSize.medium} />;
            case 'SENT':
                return <Badge id="newsletter-detail-sent" text={t('status_SENT')} type={EBadgeType.success} size={EBadgeSize.medium} />;
            case 'FAILED':
                return <Badge id="newsletter-detail-failed" text={t('status_FAILED')} type={EBadgeType.error} size={EBadgeSize.medium} />;
            default:
                return null;
        }
    };

    const recipientColumns: ITableColumn<NewsletterRecipientRecord>[] = useMemo(
        () => [
            {
                headerElement: {
                    value: 'recipient',
                    label: t('table.recipient'),
                    mobile: 'primary',
                    render: (_: unknown, row: NewsletterRecipientRecord) => {
                        const person = row.client || row.professor;
                        return (
                            <OrganismTable.Cell
                                mainText={person ? `${person.firstName} ${person.lastName}` : row.email}
                                supportingText={person ? row.email : undefined}
                            />
                        );
                    },
                },
            },
            {
                headerElement: {
                    value: 'status',
                    label: t('table.status'),
                    mobile: 'secondary',
                    render: (_: unknown, row: NewsletterRecipientRecord) => {
                        if (row.status === 'SENT') {
                            return <Badge id={`recipient-${row.id}-sent`} text={t('recipientStatus_SENT')} type={EBadgeType.success} size={EBadgeSize.small} />;
                        }
                        if (row.status === 'FAILED') {
                            return <Badge id={`recipient-${row.id}-failed`} text={t('recipientStatus_FAILED')} type={EBadgeType.error} size={EBadgeSize.small} />;
                        }
                        return <Badge id={`recipient-${row.id}-pending`} text={t('recipientStatus_PENDING')} type={EBadgeType.revprimary} size={EBadgeSize.small} />;
                    },
                },
            },
            {
                headerElement: {
                    value: 'detail',
                    label: t('table.detail'),
                    render: (_: unknown, row: NewsletterRecipientRecord) => (
                        <OrganismTable.Cell
                            mainText={row.error || formatDateTime(row.sentAt)}
                            supportingText={row.error ? formatDateTime(row.sentAt) : undefined}
                        />
                    ),
                },
            },
        ],
        [t],
    );

    const backButton = (
        <Button
            id="newsletter-back"
            type={EButtonType.tertiary}
            size={EButtonSize.medium}
            iconPosition="only"
            icon={{ name: IconComponentsEnum.arrowLeft, size: ESize.md, color: 'text-primary-600' }}
            onClick={() => router.push(Routes.Pos.newsletters)}
            aria-label={tCommon('back')}
            className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70"
        />
    );

    if (sessionStatus === 'loading' || !isAdmin) {
        return null;
    }

    if (!isNew && isNewsletterLoading) {
        return (
            <LayoutWrapper
                title={t('title')}
                leftActions={backButton}
                mainSection={
                    <Div className="flex min-h-64 items-center justify-center py-20">
                        <Spinner size={ESize.lg} color="text-primary-500" />
                    </Div>
                }
            />
        );
    }

    if (!isNew && (newsletterError || !newsletter)) {
        return (
            <LayoutWrapper
                title={t('title')}
                leftActions={backButton}
                mainSection={
                    <Div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-center text-danger-700">
                        {t('notFound')}
                    </Div>
                }
            />
        );
    }

    return (
        <>
            {/* Modal Send Confirmation */}
            {isSendConfirmOpen
                ? modalPortal(
                      <ConfirmationModal
                          title={t('sendConfirmTitle')}
                          description={t('sendConfirmDesc', {
                              count:
                                  form.getFieldValue('audience') === 'SPECIFIC_RECIPIENTS' ||
                                  newsletter?.audience === 'SPECIFIC_RECIPIENTS'
                                      ? selectedRecipients.length > 0
                                          ? selectedRecipients.length
                                          : (newsletter?.recipientsCount ?? 0)
                                      : (audienceCountData?.count ?? newsletter?.recipientsCount ?? 0),
                          })}
                          submitBtnText={t('sendConfirmAction')}
                          cancelBtnText={tCommon('cancel')}
                          onSubmit={() => sendMutation.mutate()}
                          isLoading={sendMutation.isPending}
                          icon={IconComponentsEnum.checkCircle}
                          iconBgColor="bg-primary-100"
                          iconColor="text-primary-600"
                      />,
                  )
                : null}

            {/* Modal Send Test */}
            {isTestModalOpen ? (
                <Modal
                    title={t('testModalTitle')}
                    subTitle={t('testModalDesc')}
                    canClose
                    canCloseOnClickOutisde
                    className="w-[min(92vw,480px)]"
                >
                    <Div className="space-y-4">
                        <Input
                            id="newsletter-test-email"
                            label={t('testModalEmailLabel')}
                            placeholder="admin@bibliosquad.com"
                            type={EInputType.email}
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            required
                        />
                        <Div className="flex gap-3 pt-2">
                            <Button
                                id="newsletter-test-cancel"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={tCommon('cancel')}
                                onClick={() => setIsTestModalOpen(false)}
                                className="flex-1"
                            />
                            <Button
                                id="newsletter-test-submit"
                                type={EButtonType.primary}
                                size={EButtonSize.medium}
                                text={t('sendTest')}
                                disabled={!testEmail.trim() || !testEmail.includes('@') || testMutation.isPending}
                                isLoading={testMutation.isPending}
                                onClick={() => testMutation.mutate(testEmail.trim())}
                                className="flex-1 font-bold"
                            />
                        </Div>
                    </Div>
                </Modal>
            ) : null}

            <LayoutWrapper
                title={isNew ? t('newTitle') : newsletter?.subject || t('title')}
                subTitle={
                    isNew
                        ? t('newSubtitle')
                        : `${t('status')}: ${newsletter?.status ? t(`status_${newsletter.status}`) : ''} · ${formatDateTime(newsletter?.createdAt)}`
                }
                leftActions={backButton}
                rightActions={
                    !isReadOnly ? (
                        <Div className="flex flex-wrap gap-2">
                            {!isNew ? (
                                <>
                                    <Button
                                        id="newsletter-send-test-btn"
                                        type={EButtonType.secondary}
                                        size={EButtonSize.medium}
                                        text={t('sendTest')}
                                        onClick={() => setIsTestModalOpen(true)}
                                    />
                                    <Button
                                        id="newsletter-send-btn"
                                        type={EButtonType.primary}
                                        size={EButtonSize.medium}
                                        iconPosition="left"
                                        icon={{ name: IconComponentsEnum.checkCircle, size: ESize.sm, color: 'text-white' }}
                                        text={t('sendAction')}
                                        onClick={() => {
                                            if (
                                                form.getFieldValue('audience') === 'SPECIFIC_RECIPIENTS' &&
                                                selectedRecipients.length === 0
                                            ) {
                                                setSpecificRecipientsError(t('validation.specificRecipientsRequired'));
                                                openToast(tCommon('error'), t('validation.specificRecipientsRequired'), {
                                                    type: EToastType.ERROR,
                                                });
                                                return;
                                            }
                                            setIsSendConfirmOpen(true);
                                            openModal();
                                        }}
                                        className="font-bold"
                                    />
                                </>
                            ) : null}
                            <Button
                                id="newsletter-save-draft-btn"
                                type={EButtonType.secondary}
                                size={EButtonSize.medium}
                                text={t('saveDraft')}
                                isLoading={createMutation.isPending || updateMutation.isPending}
                                onClick={() => form.handleSubmit()}
                            />
                        </Div>
                    ) : null
                }
                mainSection={
                    isReadOnly && newsletter ? (
                        /* Read-Only Mode (SENDING, SENT, FAILED) */
                        <Div className="space-y-6">
                            {/* Summary & Progress Stats Card */}
                            <Div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <Div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                    <Div className="flex flex-col gap-1">
                                        <Div className="flex items-center gap-3">
                                            {statusBadge(newsletter.status)}
                                            <Badge id="newsletter-detail-cat" text={t(`category_${newsletter.category}`)} type={EBadgeType.primary} size={EBadgeSize.small} />
                                            <Badge id="newsletter-detail-aud" text={t(`audience_${newsletter.audience}`)} type={EBadgeType.revprimary} size={EBadgeSize.small} />
                                        </Div>
                                        <Label variant={EVariantLabel.h4} color="text-gray-900" className="mt-2 font-bold">
                                            {newsletter.subject}
                                        </Label>
                                        {newsletter.preheader ? (
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                                {newsletter.preheader}
                                            </Label>
                                        ) : null}
                                    </Div>
                                    <Div className="text-end">
                                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                                            {newsletter.sentAt ? t('sentAtLabel') : t('createdAtLabel')}
                                        </Label>
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-semibold">
                                            {formatDateTime(newsletter.sentAt || newsletter.createdAt)}
                                        </Label>
                                    </Div>
                                </Div>

                                {/* Progress Bars & Counters */}
                                <Div className="pt-5">
                                    <Div className="mb-2 flex items-center justify-between">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-700" className="font-semibold">
                                            {t('progressTitle')} : {newsletter.sentCount} / {newsletter.recipientsCount}
                                        </Label>
                                        <Div className="flex items-center gap-3">
                                            <Label variant={EVariantLabel.caption} color="text-success-700" className="font-bold">
                                                {newsletter.sentCount} {t('sentCountLabel')}
                                            </Label>
                                            {newsletter.failedCount > 0 ? (
                                                <Label variant={EVariantLabel.caption} color="text-danger-600" className="font-bold">
                                                    {newsletter.failedCount} {t('failedCountLabel')}
                                                </Label>
                                            ) : null}
                                        </Div>
                                    </Div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className={twMerge(
                                                'h-full transition-all duration-500',
                                                newsletter.status === 'SENDING'
                                                    ? 'bg-warning-500 animate-pulse'
                                                    : newsletter.status === 'FAILED'
                                                      ? 'bg-danger-500'
                                                      : 'bg-success-500',
                                            )}
                                            style={{
                                                width: `${
                                                    newsletter.recipientsCount > 0
                                                        ? Math.round(
                                                              ((newsletter.sentCount + newsletter.failedCount) /
                                                                  newsletter.recipientsCount) *
                                                                  100,
                                                          )
                                                        : 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </Div>
                            </Div>

                            {/* Sent Newsletter Content Preview */}
                            <Div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <Icon name={IconComponentsEnum.eye} size={ESize.sm} color="text-primary-600" />
                                    <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-bold">
                                        {t('previewTitle')}
                                    </Label>
                                </Div>
                                <Div className="rounded-xl bg-gray-50/80 p-4 sm:p-6">
                                    <Div className="mx-auto max-w-[520px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-t-4 border-t-primary-600">
                                        <Div className="mb-6 flex justify-center">
                                            <BrandLogo alt="Biblio Squad" height={28} className="w-auto object-contain" />
                                        </Div>
                                        <Div className="mb-4 text-center">
                                            <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase text-primary-700">
                                                {t(`category_${newsletter.category}`)}
                                            </span>
                                        </Div>
                                        <h1 className="mb-5 text-center text-xl font-bold leading-snug text-primary-950 sm:text-2xl">
                                            {newsletter.subject}
                                        </h1>
                                        <Div className="text-sm leading-relaxed text-gray-700">
                                            {/<(?:p|div|h[1-6]|ul|ol|li|img|a|strong|b|em|i|u|s|table|thead|tbody|tr|th|td|blockquote|br|hr|span)[^>]*>/i.test(newsletter.body) ? (
                                                <div
                                                    className="space-y-3 break-words [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-primary-950 [&_h1]:my-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary-900 [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_a]:text-primary-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_img]:mx-auto [&_img]:block [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:text-left [&_th]:bg-gray-50 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2"
                                                    dangerouslySetInnerHTML={{ __html: sanitizeNewsletterHtml(newsletter.body) }}
                                                />
                                            ) : (
                                                newsletter.body
                                                    .split(/\n{2,}/)
                                                    .map((p) => p.trim())
                                                    .filter(Boolean)
                                                    .map((para, idx) => (
                                                        <p key={idx} className="whitespace-pre-line my-2">
                                                            {para}
                                                        </p>
                                                    ))
                                            )}
                                        </Div>
                                        {newsletter.ctaLabel && newsletter.ctaUrl ? (
                                            <Div className="my-8 text-center">
                                                <a
                                                    href={newsletter.ctaUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block rounded-xl bg-primary-600 px-7 py-3 text-sm font-bold text-white shadow-sm"
                                                >
                                                    {newsletter.ctaLabel} &rarr;
                                                </a>
                                            </Div>
                                        ) : null}
                                        <Div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs text-gray-400">
                                            <p>{t('footerNote')}</p>
                                        </Div>
                                    </Div>
                                </Div>
                            </Div>

                            {/* Recipients Table */}
                            <Div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-bold">
                                    {t('recipientsTableTitle')} ({newsletter.recipients?.length ?? 0})
                                </Label>
                                <OrganismTable<NewsletterRecipientRecord>
                                    columns={recipientColumns}
                                    rows={newsletter.recipients ?? []}
                                    pageSize={10}
                                    emptyMessage={t('noRecipients')}
                                />
                            </Div>
                        </Div>
                    ) : (
                        /* Editor & Live Preview Mode (DRAFT / NEW) */
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                        >
                            {/* Left Column: Form Controls */}
                            <Div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-bold">
                                    {t('editorSectionTitle')}
                                </Label>

                                {/* Category Selector */}
                                <form.Field name="category">
                                    {({ state, handleChange }) => (
                                        <Div className="space-y-2">
                                            <Label variant={EVariantLabel.caption} color="text-gray-700" className="font-semibold">
                                                {t('categoryLabel')}
                                            </Label>
                                            <Div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {CATEGORIES.map((cat) => (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => handleChange(cat.value)}
                                                        className={twMerge(
                                                            'flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                                                            state.value === cat.value
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-2xs'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                                                        )}
                                                    >
                                                        {t(cat.labelKey)}
                                                    </button>
                                                ))}
                                            </Div>
                                        </Div>
                                    )}
                                </form.Field>

                                {/* Audience Selector */}
                                <form.Field name="audience">
                                    {({ state, handleChange }) => (
                                        <Div className="space-y-3">
                                            <Div className="flex items-center justify-between">
                                                <Label variant={EVariantLabel.caption} color="text-gray-700" className="font-semibold">
                                                    {t('audienceLabel')}
                                                </Label>
                                                <Label variant={EVariantLabel.caption} color="text-primary-600" className="font-bold">
                                                    {state.value === 'SPECIFIC_RECIPIENTS'
                                                        ? t('audienceCountLive', { count: selectedRecipients.length })
                                                        : isAudienceCountLoading
                                                          ? '…'
                                                          : t('audienceCountLive', { count: audienceCountData?.count ?? 0 })}
                                                </Label>
                                            </Div>
                                            <Div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                {AUDIENCES.map((aud) => (
                                                    <button
                                                        key={aud.value}
                                                        type="button"
                                                        onClick={() => {
                                                            handleChange(aud.value);
                                                            setSelectedAudience(aud.value);
                                                        }}
                                                        className={twMerge(
                                                            'flex h-11 items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold transition-all cursor-pointer',
                                                            state.value === aud.value
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-2xs font-bold'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                                                        )}
                                                    >
                                                        {t(aud.labelKey)}
                                                    </button>
                                                ))}
                                            </Div>

                                            {state.value === 'SPECIFIC_RECIPIENTS' && (
                                                <NewsletterRecipientPicker
                                                    value={selectedRecipients}
                                                    onChange={(items) => {
                                                        setSelectedRecipients(items);
                                                        if (items.length > 0) setSpecificRecipientsError(null);
                                                    }}
                                                    error={!!specificRecipientsError}
                                                    hintText={specificRecipientsError ?? undefined}
                                                />
                                            )}
                                        </Div>
                                    )}
                                </form.Field>

                                {/* Subject Input */}
                                <form.Field
                                    name="subject"
                                    validators={{
                                        onSubmit: ({ value }) =>
                                            !value.trim()
                                                ? t('validation.subjectRequired')
                                                : value.trim().length > 200
                                                  ? t('validation.subjectTooLong')
                                                  : undefined,
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="newsletter-subject"
                                            label={t('subjectLabel')}
                                            placeholder={t('subjectPlaceholder')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            required
                                            error={!!state.meta.errors.length}
                                            hintText={state.meta.errors[0]}
                                        />
                                    )}
                                </form.Field>

                                {/* Preheader Input */}
                                <form.Field name="preheader">
                                    {({ state, handleChange }) => (
                                        <Input
                                            id="newsletter-preheader"
                                            label={t('preheaderLabel')}
                                            placeholder={t('preheaderPlaceholder')}
                                            value={state.value}
                                            onChange={(e) => handleChange(e.target.value)}
                                            hintText={t('preheaderHint')}
                                        />
                                    )}
                                </form.Field>

                                {/* Body Field with Rich Editor */}
                                <form.Field
                                    name="body"
                                    validators={{
                                        onSubmit: ({ value }) =>
                                            !value.trim()
                                                ? t('validation.bodyRequired')
                                                : value.trim().length > 500000
                                                  ? t('validation.bodyTooLong')
                                                  : undefined,
                                    }}
                                >
                                    {({ state, handleChange }) => (
                                        <Div className="space-y-1.5">
                                            <Label variant={EVariantLabel.caption} color="text-gray-700" className="font-semibold">
                                                {t('bodyLabel')} *
                                            </Label>
                                            <NewsletterBodyEditor
                                                value={state.value}
                                                onChange={(val) => handleChange(val)}
                                                error={!!state.meta.errors.length}
                                                hintText={state.meta.errors[0]}
                                            />
                                        </Div>
                                    )}
                                </form.Field>

                                {/* Call to action fields */}
                                <Div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <form.Field name="ctaLabel">
                                        {({ state, handleChange }) => (
                                            <Input
                                                id="newsletter-cta-label"
                                                label={t('ctaLabel')}
                                                placeholder={t('ctaLabelPlaceholder')}
                                                value={state.value}
                                                onChange={(e) => handleChange(e.target.value)}
                                            />
                                        )}
                                    </form.Field>

                                    <form.Field
                                        name="ctaUrl"
                                        validators={{
                                            onSubmit: ({ value }) =>
                                                value && !/^https:\/\/[^\s]+$/i.test(value)
                                                    ? t('validation.ctaUrlMustBeHttps')
                                                    : undefined,
                                        }}
                                    >
                                        {({ state, handleChange }) => (
                                            <Input
                                                id="newsletter-cta-url"
                                                label={t('ctaUrl')}
                                                placeholder="https://bibliosquad.com/..."
                                                value={state.value}
                                                onChange={(e) => handleChange(e.target.value)}
                                                error={!!state.meta.errors.length}
                                                hintText={state.meta.errors[0] || t('ctaUrlHint')}
                                            />
                                        )}
                                    </form.Field>
                                </Div>
                            </Div>

                            {/* Right Column: Live Email Preview */}
                            <Div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                                    <Div className="flex items-center gap-2">
                                        <Icon name={IconComponentsEnum.eye} size={ESize.sm} color="text-primary-600" />
                                        <Label variant={EVariantLabel.subtitle} color="text-gray-900" className="font-bold">
                                            {t('previewTitle')}
                                        </Label>
                                    </Div>
                                    <Badge id="newsletter-live-preview-badge" text={t('livePreviewBadge')} type={EBadgeType.revprimary} size={EBadgeSize.small} />
                                </Div>

                                {/* Email Viewport Container */}
                                <form.Subscribe selector={(state) => state.values}>
                                    {(values) => {
                                        const isHtml = /<(?:p|div|h[1-6]|ul|ol|li|img|a|strong|b|em|i|u|s|table|thead|tbody|tr|th|td|blockquote|br|hr|span)[^>]*>/i.test(
                                            values.body || '',
                                        );
                                        const paragraphs = !isHtml && values.body
                                            ? values.body
                                                  .split(/\n{2,}/)
                                                  .map((p) => p.trim())
                                                  .filter(Boolean)
                                            : [];

                                        return (
                                            <Div className="flex-1 rounded-xl bg-gray-50/80 p-4 sm:p-6">
                                                {values.preheader ? (
                                                    <Div className="mb-3 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                                                        <span className="font-bold">{t('preheaderLabel')} :</span> {values.preheader}
                                                    </Div>
                                                ) : null}

                                                {/* Email Sheet */}
                                                <Div className="mx-auto max-w-[520px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-t-4 border-t-primary-600">
                                                    {/* Brand Logo */}
                                                    <Div className="mb-6 flex justify-center">
                                                        <BrandLogo alt="Biblio Squad" height={28} className="w-auto object-contain" />
                                                    </Div>

                                                    {/* Category pill */}
                                                    <Div className="mb-4 text-center">
                                                        <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase text-primary-700">
                                                            {t(`category_${values.category}`)}
                                                        </span>
                                                    </Div>

                                                    {/* Subject */}
                                                    <h1 className="mb-5 text-center text-xl font-bold leading-snug text-primary-950 sm:text-2xl">
                                                        {values.subject || t('previewSubjectPlaceholder')}
                                                    </h1>

                                                    {/* Body */}
                                                    <Div className="text-sm leading-relaxed text-gray-700">
                                                        {values.body ? (
                                                            isHtml ? (
                                                                <div
                                                                    className="space-y-3 break-words [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-primary-950 [&_h1]:my-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary-900 [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_a]:text-primary-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_img]:mx-auto [&_img]:block [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:text-left [&_th]:bg-gray-50 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2"
                                                                    dangerouslySetInnerHTML={{ __html: sanitizeNewsletterHtml(values.body) }}
                                                                />
                                                            ) : (
                                                                paragraphs.map((para, idx) => (
                                                                    <p key={idx} className="whitespace-pre-line my-2">
                                                                        {para}
                                                                    </p>
                                                                ))
                                                            )
                                                        ) : (
                                                            <p className="italic text-gray-400 text-center py-4">
                                                                {t('previewBodyPlaceholder')}
                                                            </p>
                                                        )}
                                                    </Div>

                                                    {/* CTA button */}
                                                    {values.ctaLabel && values.ctaUrl ? (
                                                        <Div className="my-8 text-center">
                                                            <a
                                                                href={values.ctaUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-block rounded-xl bg-primary-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-700 pointer-events-none"
                                                            >
                                                                {values.ctaLabel} &rarr;
                                                            </a>
                                                        </Div>
                                                    ) : null}

                                                    {/* Footer */}
                                                    <Div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs text-gray-400">
                                                        <p>{t('footerNote')}</p>
                                                    </Div>
                                                </Div>
                                            </Div>
                                        );
                                    }}
                                </form.Subscribe>
                            </Div>
                        </form>
                    )
                }
            />
        </>
    );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { useCurrentModal } from '@/contexts/ModalContext';
import { formatPosDate, formatPosDateTime, formatSubscriptionNumber, personName, type Subscription } from '@/lib/pos-api';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';

interface PosSubscriptionReminderModalProps {
    subscription: Subscription;
    daysLeft: number;
    onSubmit: () => Promise<void>;
    isLoading?: boolean;
}

export default function PosSubscriptionReminderModal({
    subscription,
    daysLeft,
    onSubmit,
    isLoading = false,
}: Readonly<PosSubscriptionReminderModalProps>) {
    const t = useTranslations('pos');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [submitting, setSubmitting] = useState(false);

    const clientEmail = subscription.client?.email?.trim();
    const hasEmail = Boolean(clientEmail && clientEmail.includes('@'));
    const alreadyReminded = Boolean(subscription.remindedAt);

    const handleConfirm = async () => {
        if (!hasEmail || alreadyReminded || submitting || isLoading) return;
        setSubmitting(true);
        try {
            await onSubmit();
            closeModal();
        } finally {
            setSubmitting(false);
        }
    };

    const daysLeftText =
        daysLeft <= 0
            ? t('dashboard.endsToday')
            : t('dashboard.daysLeft', { count: daysLeft });

    return (
        <Modal
            title="Rappel d'échéance d'abonnement"
            subTitle="Envoyer un e-mail de rappel au client"
            canClose
            canCloseOnClickOutisde
            className="w-[min(94vw,520px)] rounded-2xl bg-white p-6 shadow-xl"
        >
            <Div className="space-y-4">
                {/* Info Card */}
                <Div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-25/80 p-4">
                    {/* Row 1: Client */}
                    <div className="grid grid-cols-[130px_1fr] items-center gap-3 pb-3">
                        <span className="text-xs font-medium text-gray-500">Client</span>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                                {personName(subscription.client)}
                            </span>
                            <span className={hasEmail ? 'text-xs text-gray-500 truncate' : 'text-xs font-medium text-danger-600'}>
                                {hasEmail ? clientEmail : 'Aucune adresse e-mail'}
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Abonnement */}
                    <div className="grid grid-cols-[130px_1fr] items-center gap-3 py-3">
                        <span className="text-xs font-medium text-gray-500">Abonnement</span>
                        <span className="text-sm font-medium text-gray-900">
                            <span className="font-semibold text-gray-700">{formatSubscriptionNumber(subscription.number)}</span>
                            {' · '}
                            <span>{subscription.productName}</span>
                        </span>
                    </div>

                    {/* Row 3: Date d'échéance */}
                    <div className="grid grid-cols-[130px_1fr] items-center gap-3 pt-3">
                        <span className="text-xs font-medium text-gray-500">Date d'échéance</span>
                        <div className="flex items-center gap-2.5 flex-nowrap min-w-0">
                            <span className="text-sm font-medium text-gray-900 tabular-nums shrink-0">
                                {formatPosDate(subscription.endDate)}
                            </span>
                            <span
                                className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    daysLeft <= 2
                                        ? 'bg-danger-50 text-danger-700'
                                        : 'bg-warning-50 text-warning-700'
                                }`}
                            >
                                {daysLeftText}
                            </span>
                        </div>
                    </div>
                </Div>

                {/* Notice box */}
                {alreadyReminded ? (
                    <Div className="flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-25 p-3 text-xs text-warning-800">
                        <Icon name={IconComponentsEnum.info} size={ESize.xs} color="text-warning-600" className="mt-0.5 shrink-0" />
                        <span>
                            Un e-mail de rappel a déjà été envoyé à ce client le{' '}
                            <strong>{formatPosDateTime(subscription.remindedAt)}</strong>. Chaque abonnement ne peut recevoir qu'un seul rappel.
                        </span>
                    </Div>
                ) : hasEmail ? (
                    <Div className="flex items-start gap-2.5 rounded-xl border border-primary-100 bg-primary-10/40 p-3 text-xs text-gray-600">
                        <Icon name={IconComponentsEnum.info} size={ESize.xs} color="text-primary-500" className="mt-0.5 shrink-0" />
                        <span>
                            Un e-mail officiel Biblio Squad sera envoyé à <strong>{clientEmail}</strong> pour l'informer de la fin prochaine de son abonnement et l'inviter à se réabonner.
                        </span>
                    </Div>
                ) : (
                    <Div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-25 p-3 text-xs text-danger-700">
                        <Icon name={IconComponentsEnum.alert} size={ESize.xs} color="text-danger-600" className="mt-0.5 shrink-0" />
                        <span>
                            Ce client ne possède aucune adresse e-mail dans sa fiche. Vous devez d'abord lui associer un e-mail dans l'onglet Clients avant de pouvoir envoyer un rappel.
                        </span>
                    </Div>
                )}

                {/* Footer Buttons */}
                <Div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        id="reminder-cancel-btn"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('return')}
                        onClick={closeModal}
                        disabled={submitting || isLoading}
                    />
                    <Button
                        id="reminder-confirm-btn"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        icon={{
                            name: alreadyReminded ? IconComponentsEnum.check : IconComponentsEnum.bell,
                            size: ESize.xs,
                            color: 'text-white',
                        }}
                        iconPosition="left"
                        text={
                            alreadyReminded
                                ? 'Rappel déjà envoyé'
                                : submitting || isLoading
                                  ? tCommon('loading')
                                  : 'Envoyer le rappel'
                        }
                        disabled={!hasEmail || alreadyReminded || submitting || isLoading}
                        isLoading={submitting || isLoading}
                        onClick={handleConfirm}
                    />
                </Div>
            </Div>
        </Modal>
    );
}

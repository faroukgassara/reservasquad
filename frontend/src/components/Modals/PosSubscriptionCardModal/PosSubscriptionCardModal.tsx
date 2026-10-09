'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import {
    formatSubscriptionNumber,
    personName,
    subscriptionCardUrl,
    type Subscription,
} from '@/lib/pos-api';
import { EButtonSize, EButtonType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

interface PosSubscriptionCardModalProps {
    subscription: Subscription;
}

export default function PosSubscriptionCardModal({ subscription }: Readonly<PosSubscriptionCardModalProps>) {
    const t = useTranslations('pos.subscriptions');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const cardUrl = subscriptionCardUrl(subscription.cardToken);
    const number = formatSubscriptionNumber(subscription.number);

    useEffect(() => {
        let cancelled = false;
        QRCode.toDataURL(cardUrl, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
            .then((data) => {
                if (!cancelled) setQrCode(data);
            })
            .catch((error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }));
        return () => {
            cancelled = true;
        };
    }, [cardUrl, openToast, tCommon]);

    const handleCopy = () => {
        navigator.clipboard
            .writeText(cardUrl)
            .then(() => openToast(tCommon('success'), t('cardLinkCopied'), { type: EToastType.SUCCESS }))
            .catch((error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }));
    };

    const handleDownload = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `${t('cardFileName')}-${number}.png`;
        link.click();
    };

    return (
        <Modal title={t('cardTitle')} subTitle={t('cardSubtitle')} canClose canCloseOnClickOutisde>
            <Div className="flex flex-col items-center gap-4">
                <Div className="flex aspect-square w-full max-w-64 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2">
                    {qrCode ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrCode} alt={t('cardQrAlt', { number })} className="size-full" />
                    ) : (
                        <Spinner color="text-primary-500" size={ESize.lg} />
                    )}
                </Div>
                <Div className="flex flex-col items-center gap-0.5 text-center">
                    <Label variant={EVariantLabel.subtitle} color="text-gray-900">
                        {personName(subscription.client)}
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="break-words">
                        {number} · {subscription.productName}
                    </Label>
                </Div>
                <Div className="grid w-full gap-2 sm:grid-cols-3">
                    <Button
                        id="subscription-card-open"
                        type={EButtonType.primary}
                        size={EButtonSize.small}
                        text={t('cardOpen')}
                        onClick={() => window.open(cardUrl, '_blank', 'noopener,noreferrer')}
                    />
                    <Button
                        id="subscription-card-copy"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        text={t('cardCopyLink')}
                        onClick={handleCopy}
                    />
                    <Button
                        id="subscription-card-download"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.arrowDown, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('cardDownload')}
                        disabled={!qrCode}
                        onClick={handleDownload}
                    />
                </Div>
            </Div>
        </Modal>
    );
}

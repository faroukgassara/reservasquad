'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { Routes } from '@/lib/routes';
import { EButtonSize, EButtonType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

/** Without a locale prefix, each visitor gets the menu in their phone's language. */
function menuUrl(): string {
    return `${window.location.origin}${Routes.Menu}`;
}

export default function PosMenuQrModal() {
    const t = useTranslations('pos.products');
    const tCommon = useTranslations('common');
    const { openToast } = useToast();
    const [url] = useState(menuUrl);
    const [qrCode, setQrCode] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        // High error correction keeps the code readable when printed small or partly covered.
        import('qrcode')
            .then((QRCodeModule) => {
                const QRCode = QRCodeModule.default || QRCodeModule;
                return QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'H' });
            })
            .then((data) => {
                if (!cancelled) setQrCode(data);
            })
            .catch((error: Error) => {
                if (!cancelled) openToast(tCommon('error'), error.message, { type: EToastType.ERROR });
            });
        return () => {
            cancelled = true;
        };
    }, [url, openToast, tCommon]);

    const handleCopy = () => {
        navigator.clipboard
            .writeText(url)
            .then(() => openToast(tCommon('success'), t('menuLinkCopied'), { type: EToastType.SUCCESS }))
            .catch((error: Error) => openToast(tCommon('error'), error.message, { type: EToastType.ERROR }));
    };

    const handleDownload = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `${t('menuQrFileName')}.png`;
        link.click();
    };

    return (
        <Modal title={t('menuQrTitle')} subTitle={t('menuQrSubtitle')} canClose canCloseOnClickOutisde>
            <Div className="flex flex-col items-center gap-4">
                <Div className="relative flex aspect-square w-full max-w-64 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2">
                    {qrCode ? (
                        <Image
                            src={qrCode}
                            alt={t('menuQrAlt')}
                            width={256}
                            height={256}
                            unoptimized
                            className="size-full object-contain"
                        />
                    ) : (
                        <Spinner color="text-primary-500" size={ESize.lg} />
                    )}
                </Div>
                <Label variant={EVariantLabel.bodySmall} color="text-gray-600" className="break-all text-center">
                    {url}
                </Label>
                <Div className="grid w-full gap-2 sm:grid-cols-3">
                    <Button
                        id="pos-menu-open"
                        type={EButtonType.primary}
                        size={EButtonSize.small}
                        text={t('menuOpen')}
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                    />
                    <Button
                        id="pos-menu-copy"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        text={t('menuCopyLink')}
                        onClick={handleCopy}
                    />
                    <Button
                        id="pos-menu-download"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        iconPosition="left"
                        icon={{ name: IconComponentsEnum.arrowDown, size: ESize.sm, color: 'text-primary-500' }}
                        text={t('menuDownload')}
                        disabled={!qrCode}
                        onClick={handleDownload}
                    />
                </Div>
            </Div>
        </Modal>
    );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import { DrawerScrollContent, DrawerActions } from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Button from '@/components/Primitives/Button/Button';
import Badge from '@/components/Primitives/Badge/Badge';
import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EBadgeSize, EBadgeType, EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import type { OrderStatus } from '@/lib/order-api';

interface OrderFilterModalProps {
    status?: OrderStatus;
    onApply: (status?: OrderStatus) => void;
    onReset: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; type: EBadgeType }[] = [
    { value: 'PENDING', type: EBadgeType.warning },
    { value: 'CONFIRMED', type: EBadgeType.success },
    { value: 'CANCELLED', type: EBadgeType.error },
];

export default function OrderFilterModal({
    status,
    onApply,
    onReset,
}: Readonly<OrderFilterModalProps>) {
    const t = useTranslations('admin.orders');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const [draftStatus, setDraftStatus] = useState(status);

    const statusLabel = (s: OrderStatus): string => {
        if (s === 'CONFIRMED') return tStatus('confirmed');
        if (s === 'CANCELLED') return tStatus('cancelled');
        return tStatus('pending');
    };

    const handleReset = () => {
        setDraftStatus(undefined);
        onReset();
    };

    return (
        <Modal
            title={tCommon('filter')}
            subTitle={t('subtitle')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerScrollContent className="gap-0 space-y-6 p-6">
                <Div className="flex flex-col gap-3">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-700">
                        {tCommon('status')}
                    </Label>
                    <Div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <Badge
                                key={opt.value}
                                id={`filter-status-${opt.value}`}
                                text={statusLabel(opt.value)}
                                size={EBadgeSize.small}
                                type={draftStatus === opt.value ? opt.type : EBadgeType.primary}
                                className={
                                    draftStatus === opt.value
                                        ? ''
                                        : 'border border-gray-200 bg-white! text-gray-600!'
                                }
                                onClick={() =>
                                    setDraftStatus(
                                        draftStatus === opt.value ? undefined : opt.value,
                                    )
                                }
                            />
                        ))}
                    </Div>
                </Div>
            </DrawerScrollContent>

            <DrawerActions>
                <Button
                    id="filter-reset"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text={tCommon('reset')}
                    onClick={handleReset}
                    className="flex-1"
                />
                <Button
                    id="filter-apply"
                    type={EButtonType.primary}
                    size={EButtonSize.medium}
                    text={tCommon('apply')}
                    onClick={() => onApply(draftStatus)}
                    className="flex-1"
                />
            </DrawerActions>
        </Modal>
    );
}

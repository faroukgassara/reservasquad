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
import type { TestimonialStatus } from '@/lib/testimonial-api';

interface TestimonialFilterModalProps {
    status?: TestimonialStatus;
    onApply: (status?: TestimonialStatus) => void;
    onReset: () => void;
}

const STATUS_OPTIONS: { value: TestimonialStatus; type: EBadgeType }[] = [
    { value: 'PENDING', type: EBadgeType.warning },
    { value: 'APPROVED', type: EBadgeType.success },
    { value: 'REJECTED', type: EBadgeType.error },
];

export default function TestimonialFilterModal({
    status,
    onApply,
    onReset,
}: Readonly<TestimonialFilterModalProps>) {
    const t = useTranslations('admin.testimonials');
    const tCommon = useTranslations('common');
    const tStatus = useTranslations('status');

    const [draftStatus, setDraftStatus] = useState(status);

    const statusLabel = (s: TestimonialStatus): string => {
        if (s === 'APPROVED') return tStatus('published');
        if (s === 'REJECTED') return tStatus('rejected');
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
                                id={`testimonial-filter-status-${opt.value}`}
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
                    id="testimonial-filter-reset"
                    type={EButtonType.secondary}
                    size={EButtonSize.medium}
                    text={tCommon('reset')}
                    onClick={handleReset}
                    className="flex-1"
                />
                <Button
                    id="testimonial-filter-apply"
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

'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import { EButtonSize, EButtonType } from '@/Enum/Enum';

interface PosFormFooterProps {
    id: string;
    onCancel: () => void;
    onSave: () => void;
    isSaving?: boolean;
    disabled?: boolean;
}

export default function PosFormFooter({ id, onCancel, onSave, isSaving = false, disabled = false }: Readonly<PosFormFooterProps>) {
    const tCommon = useTranslations('common');
    return (
        <Div className="flex justify-end gap-3 border-t border-gray-100 p-4 sm:p-5">
            <Button
                id={`${id}-cancel`}
                type={EButtonType.secondary}
                size={EButtonSize.medium}
                text={tCommon('cancel')}
                onClick={onCancel}
                className="flex-1 sm:flex-none"
            />
            <Button
                id={`${id}-save`}
                type={EButtonType.primary}
                size={EButtonSize.medium}
                text={tCommon('save')}
                isLoading={isSaving}
                disabled={disabled}
                onClick={onSave}
                className="flex-1 sm:flex-none"
            />
        </Div>
    );
}

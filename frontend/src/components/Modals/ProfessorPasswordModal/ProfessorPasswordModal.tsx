'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Input from '@/components/Primitives/Input/Input';
import Label from '@/components/Primitives/Label/Label';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { checkNewPassword } from '@/lib/password-rules';

interface IProfessorPasswordModal {
    professorName: string;
    email: string | null;
    isLoading?: boolean;
    onSubmit: (newPassword: string) => void;
}

export default function ProfessorPasswordModal({
    professorName,
    email,
    isLoading = false,
    onSubmit,
}: Readonly<IProfessorPasswordModal>) {
    const t = useTranslations('admin.professors');
    const tAuth = useTranslations('auth');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        const rule = checkNewPassword(password, confirm);
        const message = rule ? tAuth(`validation.${rule}`) : null;
        setError(message);
        if (!message) onSubmit(password);
    };

    return (
        <Modal title={t('portalPasswordTitle')} subTitle={professorName} canClose canCloseOnClickOutisde>
            <Div className="space-y-4">
                {email ? (
                    <Div className="rounded-xl bg-gray-50 px-4 py-3">
                        <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                            {t('portalLogin')}
                        </Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="block font-medium break-all">
                            {email}
                        </Label>
                    </Div>
                ) : null}
                <Input
                    id="professor-portal-password"
                    label={tAuth('newPassword')}
                    placeholder={tAuth('enterYourNewPassword')}
                    isPassword
                    required
                    value={password}
                    error={Boolean(error)}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    id="professor-portal-password-confirm"
                    label={tAuth('confirmPassword')}
                    placeholder={tAuth('confirmYourPassword')}
                    isPassword
                    required
                    value={confirm}
                    error={Boolean(error)}
                    hintText={error ?? undefined}
                    onChange={(e) => setConfirm(e.target.value)}
                />
                <Label variant={EVariantLabel.caption} color="text-gray-500" className="block">
                    {t('portalPasswordHint')}
                </Label>
                <Div className="flex gap-3">
                    <Button
                        id="professor-portal-password-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="professor-portal-password-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={handleSubmit}
                        className="flex-1"
                    />
                </Div>
            </Div>
        </Modal>
    );
}

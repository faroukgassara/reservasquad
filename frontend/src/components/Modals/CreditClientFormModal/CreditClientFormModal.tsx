'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/Primitives/Modal/Modal';
import {
    DrawerActions,
    DrawerForm,
    DrawerScrollContent,
} from '@/components/Primitives/DrawerLayout/DrawerLayout';
import Button from '@/components/Primitives/Button/Button';
import OrganismClientFormFields, {
    useClientForm,
    type CreditClientFormValues,
} from '@/components/Organisms/OrganismClientFormFields/OrganismClientFormFields';
import { useCurrentModal } from '@/contexts/ModalContext';
import { EButtonSize, EButtonType } from '@/Enum/Enum';
import type { CreditClientRecord } from '@/lib/credit-api';

interface CreditClientFormModalProps {
    client?: CreditClientRecord | null;
    onSubmit: (values: CreditClientFormValues) => Promise<void>;
    isLoading?: boolean;
}

export default function CreditClientFormModal({
    client,
    onSubmit,
    isLoading = false,
}: Readonly<CreditClientFormModalProps>) {
    const t = useTranslations('admin.credits');
    const tCommon = useTranslations('common');
    const { closeModal } = useCurrentModal();

    const form = useClientForm(client, async (values) => {
        await onSubmit(values);
        closeModal();
    });

    return (
        <Modal
            title={client ? t('editClient') : t('createClient')}
            subTitle={t('clientFormHint')}
            canClose
            canCloseOnClickOutisde
            isDrawer
        >
            <DrawerForm
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <DrawerScrollContent>
                    <OrganismClientFormFields form={form} idPrefix="credit-client" />
                </DrawerScrollContent>
                <DrawerActions>
                    <Button
                        id="credit-client-cancel"
                        type={EButtonType.secondary}
                        size={EButtonSize.medium}
                        text={tCommon('cancel')}
                        onClick={closeModal}
                        className="flex-1"
                    />
                    <Button
                        id="credit-client-submit"
                        type={EButtonType.primary}
                        size={EButtonSize.medium}
                        text={tCommon('save')}
                        isLoading={isLoading}
                        onClick={() => form.handleSubmit()}
                        className="flex-1"
                    />
                </DrawerActions>
            </DrawerForm>
        </Modal>
    );
}

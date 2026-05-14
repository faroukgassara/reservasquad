import { useTranslation } from 'next-i18next';
import { Button, Modal } from '@/components/Molecules';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import { useCurrentModal } from '@/contexts/ModalContext';
import { Div, Icon, Label } from '@/components/Atoms';
import IConfirmationModalProps from '@/interfaces/Modals/IConfirmationModalProps/IConfirmationModalProps';
import { EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { ELabelColor } from '@/theme/labelColors';

const ConfirmationModal = ({ overlay, ...props }: IConfirmationModalProps) => {
    const { t } = useTranslation();
    const { closeModal } = useCurrentModal();

    const handleCancel = () => closeModal();
    const handleSubmit = () => {
        props.onSubmit?.();
    };

    const iconName = props.icon ?? IconComponentsEnum.exclamationTriangle;
    const iconBgColor = props.iconBgColor ?? 'bg-warning-100';
    const iconColor = props.iconColor ?? 'text-warning-500';

    const modalContent = (
        <Div className="w-full flex flex-col gap-5 px-2 pb-2">
            <Div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${iconBgColor}`}>
                <Icon
                    name={iconName}
                    color={iconColor as ELabelColor}
                    size={ESize.md}
                />
            </Div>

            <Div className="flex flex-col gap-1 w-full">
                {props.title && (
                    <Label color="text-primary-500" variant={EVariantLabel.h6}>
                        {props.title}
                    </Label>
                )}
                {props.description && (
                    <Label color="text-gray-500" variant={EVariantLabel.bodySmall}>
                        {props.description}
                    </Label>
                )}
            </Div>

            <Div className="w-full flex gap-3 pt-2">
                <AtomButton
                    id="cancel-btn"
                    type={EButtonType.secondary}
                    className="flex-1"
                    text={props.cancelBtnText ?? t('common.return')}
                    onClick={handleCancel}
                    disabled={props.isLoading}
                />
                <Button
                    id="confirm-btn"
                    type={EButtonType.primary}
                    className="flex-1"
                    text={props.submitBtnText ?? t('common.validate')}
                    isLoading={props.isLoading}
                    onClick={handleSubmit}
                />
            </Div>
        </Div>
    );

    if (overlay) {
        return (
            <Div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <Div className="bg-white rounded-xxl shadow-lg w-[min(92vw,400px)] p-6">
                    {modalContent}
                </Div>
            </Div>
        );
    }

    return (
        <Modal
            title=""
            canClose={false}
            canCloseOnClickOutisde={false}
            className={props.containerClassName ?? 'p-6 w-[min(92vw,400px)] bg-white rounded-xxl shadow-lg'}
            isDrawer={false}
        >
            {modalContent}
        </Modal>
    );
};

export default ConfirmationModal;
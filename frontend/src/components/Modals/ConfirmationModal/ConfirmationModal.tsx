import { useTranslation } from 'next-i18next';
import MoleculeModal from '@/components/Molecules/MoleculeModal/MoleculeModal';
import { useCurrentModal } from '@/contexts/ModalContext';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import IConfirmationModalProps from '@/interfaces/Modals/IConfirmationModalProps/IConfirmationModalProps';
import { EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { ELabelColor } from '@/theme/labelColors';
import MoleculeButton from '@/components/Molecules/MoleculeButton/MoleculeButton';
import AtomIcon from '@/components/Atoms/AtomIcon/AtomIcon';

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
        <AtomDiv className="w-full flex flex-col gap-5 px-2 pb-2">
            <AtomDiv className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${iconBgColor}`}>
                <AtomIcon
                    name={iconName}
                    color={iconColor as ELabelColor}
                    size={ESize.md}
                />
            </AtomDiv>

            <AtomDiv className="flex flex-col gap-1 w-full">
                {props.title && (
                    <AtomLabel color="text-primary-500" variant={EVariantLabel.h6}>
                        {props.title}
                    </AtomLabel>
                )}
                {props.description && (
                    <AtomLabel color="text-gray-500" variant={EVariantLabel.bodySmall}>
                        {props.description}
                    </AtomLabel>
                )}
            </AtomDiv>

            <AtomDiv className="w-full flex gap-3 pt-2">
                <MoleculeButton
                    id="cancel-btn"
                    type={EButtonType.secondary}
                    className="flex-1"
                    text={props.cancelBtnText ?? t('common.return')}
                    onClick={handleCancel}
                    disabled={props.isLoading}
                />
                <MoleculeButton
                    id="confirm-btn"
                    type={EButtonType.primary}
                    className="flex-1"
                    text={props.submitBtnText ?? t('common.validate')}
                    isLoading={props.isLoading}
                    onClick={handleSubmit}
                />
            </AtomDiv>
        </AtomDiv>
    );

    if (overlay) {
        return (
            <AtomDiv className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <AtomDiv className="bg-white rounded-xxl shadow-lg w-[min(92vw,400px)] p-6">
                    {modalContent}
                </AtomDiv>
            </AtomDiv>
        );
    }

    return (
        <MoleculeModal
            title=""
            canClose={false}
            canCloseOnClickOutisde={false}
            className={props.containerClassName ?? 'p-6 w-[min(92vw,400px)] bg-white rounded-xxl shadow-lg'}
            isDrawer={false}
        >
            {modalContent}
        </MoleculeModal>
    );
};

export default ConfirmationModal;
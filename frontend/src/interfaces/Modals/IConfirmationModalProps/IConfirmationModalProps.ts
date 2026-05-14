import { IconComponentsEnum } from "@/Enum/Enum";

export default interface IConfirmationModalProps {
    overlay?: boolean;
    cancelBtnText?: string;
    submitBtnText?: string;
    title?: string;
    description?: string;
    onSubmit?: () => void;
    isLoading?: boolean;
    containerClassName?: string;
    icon?: IconComponentsEnum;
    iconBgColor?: string;
    iconColor?: string;
}
import { EButtonSize, EButtonType } from "@/Enum/Enum";
import { IAtomButton } from "@/interfaces/Atoms";
import { IAtomIcon } from "@/interfaces/Atoms/IAtomIcon/IAtomIcon";

export default interface IMoleculeButton extends IAtomButton {
  text?: string;
  icon?: IAtomIcon;
  iconPosition?: 'left' | 'right' | 'only';
  size?: EButtonSize;
  type?: EButtonType;
  disabled?: boolean;
  isLoading?: boolean;
  spinnerSize?: string;
  spinnerColor?: string;
}

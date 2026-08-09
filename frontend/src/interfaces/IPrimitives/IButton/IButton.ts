import { EButtonSize, EButtonType, ESize } from "@/Enum/Enum";
import { IIcon } from "@/interfaces/IPrimitives/IIcon/IIcon";

export default interface IButton {
  text?: string;
  icon?: IIcon;
  iconPosition?: 'left' | 'right' | 'only';
  size?: EButtonSize;
  type?: EButtonType
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: any,
  className?: string,
  id: string
  spinnerColor?: string;
  spinnerSize?: ESize;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

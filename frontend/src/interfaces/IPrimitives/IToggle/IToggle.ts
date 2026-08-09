import { EToggleSize } from "@/Enum/Enum";

export interface IToggle {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: EToggleSize;
  variant?: 'rounded' ;
  id?: string;
  className?: string;
}

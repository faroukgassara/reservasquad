import { EBadgeColor, EBadgeSize } from "@/Enum/Enum";

export default interface IMoleculeTag {
  label: string;
  onRemove?: (label: string) => void;
  color?: EBadgeColor;
  size?: EBadgeSize;

  className?: string;
  badgeClassName?: string;
  removable?: boolean;  
}

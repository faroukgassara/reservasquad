
export interface IAtomToggle {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'rounded' ;
  id?: string;
  className?: string;
}
import ITabOption from "../ITabOption/ITabOption";

export default interface IMoleculeTabs {
  options: ITabOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pills';
  disabled?: boolean;
  className?: string;
}
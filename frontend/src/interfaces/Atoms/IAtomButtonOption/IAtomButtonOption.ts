import {IconComponentsEnum } from "@/Enum/Enum";
export default interface IButtonOption {
  label?: string;
  value: string;
  icon?: IconComponentsEnum;
  disabled?: boolean;
}

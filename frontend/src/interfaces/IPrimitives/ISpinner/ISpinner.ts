import { IIcon } from "../IIcon/IIcon";

export interface ISpinner extends Omit<IIcon, 'name' | 'handleClick'> { }
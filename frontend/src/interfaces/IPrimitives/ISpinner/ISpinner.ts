import { IIcon } from "../IIcon/IIcon";

export type ISpinner = Omit<IIcon, 'name' | 'handleClick'>;

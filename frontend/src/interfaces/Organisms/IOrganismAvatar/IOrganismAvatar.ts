import { ESize } from "@/Enum/Enum";
import IAtomAvatar from "@/interfaces/Atoms/IAtomAvatar/IAtomAvatar";

export default interface IOrganismAvatar {
  items: IAtomAvatar[];
  size?: ESize;
  max?: number;
  className?: string;
}

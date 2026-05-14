import { ESize, EStatus } from "@/Enum/Enum";

export default interface IMoleculeAvatarLabel {
  id:string;
  src?: string;
  name: string;
  email?: string;
  size?: ESize;
  status?: EStatus;
  className?: string;
}
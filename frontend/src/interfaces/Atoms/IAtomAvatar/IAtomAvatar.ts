import { ESize, EStatus, Ebadge } from "@/Enum/Enum";

export default interface IAtomAvatar {
  id: string
  src?: string;
  alt?: string;
  name?: string;
  size?: ESize;
  variant?: "circle" | "rounded";
  ring?: boolean;
  status?: EStatus;     
  badge?: Ebadge;     
  className?: string;
  stacked?: boolean;
}

import { ESize } from "@/Enum/Enum";

export default interface IAvatar {
  id: string
  name?: string;
  size?: ESize;
  className?: string;
  email?: string;
}
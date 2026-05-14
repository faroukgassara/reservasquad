export type FileType = "pdf" | "video" | "image" | "file";

export default interface IMoleculeFileUploadItem {
  fileName: string;
  fileSize: string;
  progress: number;
  fileType:FileType;
  onDelete?: () => void;
  showPercent?: boolean 
}
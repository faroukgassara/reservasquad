
export default interface IUploadDropzone {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  description: string
}
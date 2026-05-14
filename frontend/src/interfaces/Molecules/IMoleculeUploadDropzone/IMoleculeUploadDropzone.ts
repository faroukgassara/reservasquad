
export default interface IMoleculeUploadDropzone {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  description:string
}
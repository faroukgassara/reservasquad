export interface IUploadedFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'video' | 'image' | 'file';
  progress: number;
}

export default interface IOrganismFileUploader {

  multiple?: boolean;
  onUpload?: (files: File[]) => void;
  className?: string;
  showPercent?: boolean
  dropzoneDescription :string
}
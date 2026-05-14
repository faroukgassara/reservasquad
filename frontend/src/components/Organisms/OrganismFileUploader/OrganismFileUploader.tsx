
'use client';
import React, { useState, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import MoleculeUploadDropzone from '@/components/Molecules/MoleculeUploadDropzone/MoleculeUploadDropzone';
import MoleculeFileUploadItem from '@/components/Molecules/MoleculeFileUploadItem/MoleculeFileUploadItem';
import IOrganismFileUploader, { IUploadedFile } from '@/interfaces/Organisms/IOrganismFileUploader/IOrganismFileUploader';


function getFileType(file: File): IUploadedFile['fileType'] {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export default function OrganismFileUploader({

  multiple = true,
  onUpload,
  className,
  showPercent,
  dropzoneDescription
}: IOrganismFileUploader) {
  const [uploadedFiles, setUploadedFiles] = useState<IUploadedFile[]>([]);

  const simulateUpload = useCallback((id: string) => {
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress } : f))
      );
    }, 200);
  }, []);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const newFiles: IUploadedFile[] = files.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: getFileType(file),
        progress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach((f) => simulateUpload(f.id));
      onUpload?.(files);
    },
    [simulateUpload, onUpload]
  );

  const handleDelete = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={twMerge('flex flex-col gap-3 w-full', className)}>
      <MoleculeUploadDropzone
        onFilesSelected={handleFilesSelected}
       
        multiple={multiple}
        description={dropzoneDescription}
      />

      {uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploadedFiles.map((f) => (
            <MoleculeFileUploadItem
              key={f.id}
              fileName={f.fileName}
              fileSize={f.fileSize}
              progress={f.progress}
              fileType={f.fileType}
              showPercent={showPercent}
              onDelete={() => handleDelete(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
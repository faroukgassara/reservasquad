'use client';
import React, { useRef, useState, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import IMoleculeUploadDropzone from '@/interfaces/Molecules/IMoleculeUploadDropzone/IMoleculeUploadDropzone';
import { toast } from "react-toastify";
import { validateFileSignature, ACCEPTED_TYPES } from '@/common/upload/acceptedTypes';
import { Div, Icon, Label } from '@/components/Atoms';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
const ACCEPT_ATTRIBUTE = Object.values(ACCEPTED_TYPES).flat().join(',');

export default function MoleculeUploadDropzone({
  onFilesSelected,
  accept = ACCEPT_ATTRIBUTE,
  multiple = true,
  className,
  description
}: IMoleculeUploadDropzone) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const matchesMime = (fileType: string, rule: string) => {
    const ft = (fileType || "").toLowerCase();
    const r = rule.toLowerCase();

    if (r === "*/*") return true;
    if (r.endsWith("/*")) {
      const prefix = r.slice(0, -2);
      return ft.startsWith(prefix + "/");
    }
    return ft === r;
  };
 
  const handleFiles = useCallback(
  async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);

    const mimeAccepted = selected.filter((file) =>
      Object.values(ACCEPTED_TYPES).some((list) =>
        list.some((rule) => matchesMime(file.type, rule))
      )
    );
    const mimeRejected = selected.filter((f) => !mimeAccepted.includes(f));
    const results = await Promise.all(
      mimeAccepted.map(async (file) => {
        const result = await validateFileSignature(file);
        return { file, ...result };
      })
    );

    const acceptedFiles = results.filter((r) => r.valid).map((r) => r.file);

    const spoofedFiles = results
      .filter((r) => !r.valid && r.reason === 'signature_mismatch')
      .map((r) => r.file);

    const unsupportedFiles = [
      ...mimeRejected,
      ...results
        .filter((r) => !r.valid && r.reason !== 'signature_mismatch')
        .map((r) => r.file),
    ];

    if (unsupportedFiles.length > 0) {
      toast.error(
        `Type de fichier non supporté: ${unsupportedFiles.map((f) => f.name).join(', ')}`,
        { position: 'top-right' }
      );
    }

    if (spoofedFiles.length > 0) {
      toast.error(
        `Fichier corrompu ou falsifié: ${spoofedFiles.map((f) => f.name).join(', ')}`,
        { position: 'top-right' }
      );
    }

    if (acceptedFiles.length === 0) return;
    onFilesSelected(acceptedFiles);
  },
  [onFilesSelected]
);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };


  return (
    <Div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={twMerge(
        'flex flex-col items-center justify-center gap-1 py-8 px-6 rounded-xl border border-dashed border-gray-300 bg-white cursor-pointer transition-colors duration-200',
        isDragging && 'border-primary-400 bg-primary-50/40',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon name={IconComponentsEnum.uplaod} size={ESize.md} color="text-gray-600" />
      </Div>

      <Label variant={EVariantLabel.bodySmall} color="text-primary-500" className="font-semibold cursor-pointer hover:underline text-center">
        Parcourir
      </Label>
      {description && (
        <Label variant={EVariantLabel.hint} color="text-gray-600">
          {description}
        </Label>
      )}
    </Div>
  );
}

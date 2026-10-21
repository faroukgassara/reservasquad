'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import UploadDropzone from '@/components/Primitives/UploadDropzone/UploadDropzone';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import Spinner from '@/components/Primitives/Spinner/Spinner';
import { EButtonSize, EButtonType, ESize, EToastType, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getMediaUrl } from '@/lib/media-url';
import { uploadMultipartImage } from '@/lib/upload-api';
import { useToast } from '@/contexts/ToastContext';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export interface IImageUpload {
    id: string;
    label: string;
    value?: string;
    onChange: (imageUrl: string) => void;
    onClear?: () => void;
    onUpload?: (file: File) => Promise<string>;
    uploadEndpoint?: string;
    maxSizeInMb?: number;
    required?: boolean;
    error?: boolean;
    hintText?: string;
    containerClassName?: string;
    previewClassName?: string;
}

export default function ImageUpload({
    id,
    label,
    value,
    onChange,
    onClear,
    onUpload,
    uploadEndpoint = '/api/pos/upload',
    maxSizeInMb = 5,
    required = false,
    error = false,
    hintText,
    containerClassName = '',
    previewClassName = 'h-40',
}: Readonly<IImageUpload>) {
    const { openToast } = useToast();
    const displayUrl = useMemo(() => getMediaUrl(value || ''), [value]);
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFilesSelected = useCallback(
        async (files: File[]) => {
            const file = files[0];
            if (!file) return;

            // 1. Client-side type check
            const isImage = file.type.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
            if (!isImage) {
                openToast('Format non supporté', 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, GIF, SVG).', {
                    type: EToastType.ERROR,
                });
                return;
            }

            // 2. Client-side size check (maxSizeInMb)
            const maxBytes = maxSizeInMb * 1024 * 1024;
            if (file.size > maxBytes) {
                openToast('Fichier trop volumineux', `La taille maximale autorisée est de ${maxSizeInMb} Mo.`, {
                    type: EToastType.ERROR,
                });
                return;
            }

            // 3. Multipart upload
            try {
                setIsUploading(true);
                const uploadedUrl = onUpload
                    ? await onUpload(file)
                    : await uploadMultipartImage(file, uploadEndpoint);
                onChange(uploadedUrl);
                setFailedUrl(null);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Erreur lors du téléversement de l'image";
                openToast('Erreur de téléversement', message, { type: EToastType.ERROR });
            } finally {
                setIsUploading(false);
            }
        },
        [maxSizeInMb, onChange, onUpload, openToast, uploadEndpoint]
    );

    return (
        <Div className={`flex flex-col gap-2 w-full ${containerClassName}`}>
            {label && (
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="mb-1">
                    {label}
                    {required && (
                        <Label color="text-primary-500" className="align-middle ms-1" variant={EVariantLabel.bodySmall}>
                            *
                        </Label>
                    )}
                </Label>
            )}
            {value ? (
                <Div className={twMerge('relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50', previewClassName)}>
                    {isUploading ? (
                        <Div className="flex size-full flex-col items-center justify-center gap-2 bg-gray-50/80">
                            <Spinner size={ESize.md} color="text-primary-600" />
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                Téléversement...
                            </Label>
                        </Div>
                    ) : !displayUrl || failedUrl === displayUrl ? (
                        <Div className="flex size-full items-center justify-center">
                            <Icon name={IconComponentsEnum.image} size={ESize.lg} color="text-gray-400" />
                        </Div>
                    ) : (
                        <Image
                            src={displayUrl}
                            alt="Aperçu"
                            fill
                            sizes="(max-width: 768px) 100vw, 500px"
                            unoptimized={displayUrl.startsWith('data:') || displayUrl.startsWith('blob:')}
                            className="object-cover"
                            onError={() => setFailedUrl(displayUrl)}
                        />
                    )}
                    <Div className="absolute top-2 end-2 z-10 flex gap-2">
                        <Button
                            id={`${id}-change-btn`}
                            type={EButtonType.secondary}
                            icon={{ name: IconComponentsEnum.edit, size: ESize.md, color: 'text-gray-600' }}
                            iconPosition="only"
                            size={EButtonSize.small}
                            disabled={isUploading}
                            onClick={() => document.getElementById(`${id}-file-input`)?.click()}
                            className="bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-lg"
                        />
                        {onClear && (
                            <Button
                                id={`${id}-clear-btn`}
                                type={EButtonType.secondary}
                                icon={{ name: IconComponentsEnum.trash, size: ESize.md, color: 'text-gray-600' }}
                                iconPosition="only"
                                size={EButtonSize.small}
                                disabled={isUploading}
                                onClick={onClear}
                                className="bg-white/90 hover:bg-danger-50 border border-gray-200 shadow-sm rounded-lg"
                            />
                        )}
                    </Div>
                    <input
                        id={`${id}-file-input`}
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFilesSelected([file]);
                            e.target.value = '';
                        }}
                    />
                </Div>
            ) : (
                <Div className="relative w-full">
                    {isUploading ? (
                        <Div className={twMerge('flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50', previewClassName)}>
                            <Spinner size={ESize.md} color="text-primary-600" />
                            <Label variant={EVariantLabel.caption} color="text-gray-500">
                                Téléversement en cours...
                            </Label>
                        </Div>
                    ) : (
                        <UploadDropzone
                            onFilesSelected={handleFilesSelected}
                            accept={IMAGE_ACCEPT}
                            multiple={false}
                            description="Glissez une image ou cliquez pour parcourir (JPG, PNG, WebP, GIF, max 5 Mo)"
                        />
                    )}
                </Div>
            )}
            {hintText && (
                <Div className="flex items-center gap-1">
                    <Icon
                        color={error ? 'text-danger-600' : 'text-gray-600'}
                        name="info"
                        size={ESize.md}
                    />
                    <Label
                        variant={EVariantLabel.hint}
                        color={error ? 'text-danger-600' : 'text-gray-600'}
                    >
                        {hintText}
                    </Label>
                </Div>
            )}
        </Div>
    );
}

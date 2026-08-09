'use client';

import { useCallback, useMemo } from 'react';
import UploadDropzone from '@/components/Primitives/UploadDropzone/UploadDropzone';
import Button from '@/components/Primitives/Button/Button';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { getMediaUrl } from '@/lib/media-url';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export interface IImageUpload {
    id: string;
    label: string;
    value?: string;
    onChange: (imageUrl: string) => void;
    onClear?: () => void;
    required?: boolean;
    error?: boolean;
    hintText?: string;
    containerClassName?: string;
}

export default function ImageUpload({
    id,
    label,
    value,
    onChange,
    onClear,
    required = false,
    error = false,
    hintText,
    containerClassName = '',
}: Readonly<IImageUpload>) {
    const displayUrl = useMemo(() => getMediaUrl(value || ''), [value]);

    const handleFilesSelected = useCallback(
        async (files: File[]) => {
            const file = files[0];
            if (!file) return;
            try {
                const dataUrl = await fileToDataUrl(file);
                onChange(dataUrl);
            } catch {
                // ignore
            }
        },
        [onChange]
    );

    return (
        <Div className={`flex flex-col gap-2 w-full ${containerClassName}`}>
            {label && (
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="mb-1">
                    {label}
                    {required && (
                        <Label color="text-primary-500" className="align-middle ml-1" variant={EVariantLabel.bodySmall}>
                            *
                        </Label>
                    )}
                </Label>
            )}
            {value ? (
                <Div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={displayUrl}
                        alt="Aperçu"
                        className="w-full h-40 object-cover"
                    />
                    <Div className="absolute top-2 right-2 flex gap-2">
                        <Button
                            id={`${id}-change-btn`}
                            type={EButtonType.secondary}
                            icon={{ name: IconComponentsEnum.edit, size: ESize.md, color: 'text-gray-600' }}
                            iconPosition="only"
                            size={EButtonSize.small}
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
                <UploadDropzone
                    onFilesSelected={handleFilesSelected}
                    accept={IMAGE_ACCEPT}
                    multiple={false}
                    description="Glissez une image ou cliquez pour parcourir (JPG, PNG, WebP, GIF)"
                />
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

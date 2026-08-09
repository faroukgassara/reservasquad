'use client';

import Icon from '@/components/Primitives/Icon/Icon';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, ESize, IconComponentsEnum } from '@/Enum/Enum';
import { useTranslations } from 'next-intl';
import ProgressBar from '../ProgressBar/ProgressBar';
import IFileUploadItem from '@/interfaces/IPrimitives/IFileUploadItem/IFileUploadItem';

export default function FileUploadItem({
    fileName,
    fileSize,
    progress,
    fileType,
    onDelete,
    showPercent
}: Readonly<IFileUploadItem>) {
    const t = useTranslations('common');

    const getIconByFileType = () => {
        switch (fileType) {
            case "image":
                return IconComponentsEnum.image;
            case "pdf":
                return IconComponentsEnum.pdf;
            case "video":
                return IconComponentsEnum.video;
            case "file":
            default:
                return IconComponentsEnum.filetext;
        }
    };
    return (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white w-full">

            <Icon name={getIconByFileType()} size={ESize.md} color="text-primary-500" />

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 ">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                        <p className="text-xs text-gray-400">{fileSize}</p>
                    </div>
                    <div>
                        <Button
                            id="remove-file-button"
                            type={EButtonType.tertiary}
                            size={EButtonSize.small}
                            iconPosition="only"
                            icon={{
                                name: IconComponentsEnum.trash,
                                size: ESize.sm,
                                color: 'text-gray-400',
                            }}
                            onClick={onDelete}
                            aria-label={t('removeFile')}
                            className="shrink-0 border-none bg-transparent hover:bg-transparent hover:opacity-80"
                        />
                    </div>
                </div>

                <ProgressBar value={progress} showPercent={showPercent} className="w-full" />
            </div>
        </div>
    );
}


import { Icon } from '@/components/Atoms';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import AtomProgressBar from '@/components/Atoms/AtomProgressBar/AtomProgressBar';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import IMoleculeFileUploadItem from '@/interfaces/Molecules/IMoleculeFileUploadItem/IMoleculeFileUploadItem';

export default function MoleculeFileUploadItem({
    fileName,
    fileSize,
    progress,
    fileType,
    onDelete,
    showPercent 
}: IMoleculeFileUploadItem) {
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
                      
                        <AtomButton
                            id={"remove-file-button"}
                            onClick={onDelete}
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Remove file"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M5 4V2.5A.5.5 0 0 1 5.5 2h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l.8 9.1A1 1 0 0 0 4.8 14h6.4a1 1 0 0 0 1-.9L13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </AtomButton>
                    </div>
                </div>

                <AtomProgressBar value={progress} showPercent={showPercent} className="w-full" />
            </div>
        </div>
    );
}
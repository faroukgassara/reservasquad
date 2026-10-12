import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import { getMediaUrl } from '@/lib/media-url';

interface IPosThumbnail {
    imageUrl: string | null | undefined;
    alt: string;
    className?: string;
    fallbackLetter?: string;
}

export default function PosThumbnail({ imageUrl, alt, className, fallbackLetter }: Readonly<IPosThumbnail>) {
    const letter = fallbackLetter ?? (alt?.trim() ? alt.trim().charAt(0).toUpperCase() : '');

    return (
        <Div
            className={twMerge(
                'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gradient-to-br from-gray-50 via-gray-100 to-primary-50/30 shadow-2xs',
                className,
            )}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(imageUrl)} alt={alt} className="size-full object-cover" />
            ) : letter ? (
                <span className="text-xs font-black uppercase text-gray-500 select-none">
                    {letter}
                </span>
            ) : (
                <Icon name={IconComponentsEnum.layers} size={ESize.sm} color="text-gray-400" />
            )}
        </Div>
    );
}

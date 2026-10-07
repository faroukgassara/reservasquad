import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { ESize, IconComponentsEnum } from '@/Enum/Enum';
import { getMediaUrl } from '@/lib/media-url';

interface IPosThumbnail {
    imageUrl: string | null | undefined;
    alt: string;
    className?: string;
}

export default function PosThumbnail({ imageUrl, alt, className }: Readonly<IPosThumbnail>) {
    return (
        <Div
            className={twMerge(
                'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100',
                className,
            )}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(imageUrl)} alt={alt} className="size-full object-cover" />
            ) : (
                <Icon name={IconComponentsEnum.image} size={ESize.md} color="text-gray-400" />
            )}
        </Div>
    );
}

'use client';

import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { useCart, type CartLine } from '@/contexts/CartContext';
import { formatProductMoney } from '@/lib/product-api';
import { getProductImageUrl } from '@/lib/product-api';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

type CartLineCardProps = Readonly<{
    line: CartLine;
    compact?: boolean;
}>;

export default function CartLineCard({ line, compact = false }: CartLineCardProps) {
    const tCart = useTranslations('cart');
    const locale = useLocale();
    const { setQuantity, removeItem } = useCart();

    const variantParts: string[] = [];
    if (line.materialKey) variantParts.push(line.materialKey);
    if (line.sizeKey) variantParts.push(line.sizeKey);
    const variantLabel = variantParts.join(' - ');
    const lineTotal = line.unitPrice * line.quantity;
    const imageSrc = getProductImageUrl(line.imageUrl);

    return (
        <Div
            className={twMerge(
                'relative flex gap-3 rounded-2xl border border-gray-200 bg-white p-3',
                compact ? 'sm:gap-3.5 sm:p-3.5' : 'gap-4 p-4 sm:p-5',
            )}
        >
            <Div
                className={twMerge(
                    'shrink-0 overflow-hidden rounded-xl bg-gray-100',
                    compact ? 'size-20' : 'size-24 sm:size-28',
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="" className="size-full object-cover" />
            </Div>

            <Div className="flex min-w-0 flex-1 flex-col">
                <Div className="pe-7">
                    <Label
                        variant={compact ? EVariantLabel.bodySmall : EVariantLabel.body}
                        color="text-gray-900"
                        className="block"
                    >
                        {line.title}
                    </Label>
                    {variantLabel ? (
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-500"
                            className="mt-0.5 block"
                        >
                            {variantLabel}
                        </Label>
                    ) : null}
                    {line.engraving ? (
                        <Label
                            variant={EVariantLabel.caption}
                            color="text-gray-500"
                            className="mt-0.5 block"
                        >
                            {tCart('engraving', { text: line.engraving })}
                        </Label>
                    ) : null}
                </Div>

                <Div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <Div className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-gray-25">
                        <button
                            type="button"
                            aria-label={tCart('decreaseQty')}
                            onClick={() => setQuantity(line.id, Math.max(1, line.quantity - 1))}
                            className="flex size-9 items-center justify-center text-primary-500 transition-colors hover:bg-primary-25"
                        >
                            −
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-gray-900">
                            {line.quantity}
                        </span>
                        <button
                            type="button"
                            aria-label={tCart('increaseQty')}
                            onClick={() => setQuantity(line.id, line.quantity + 1)}
                            className="flex size-9 items-center justify-center text-primary-500 transition-colors hover:bg-primary-25"
                        >
                            +
                        </button>
                    </Div>
                    <Label variant={EVariantLabel.body} color="text-primary-500">
                        {formatProductMoney(lineTotal, locale)}
                    </Label>
                </Div>
            </Div>

            <Icon
                name={IconComponentsEnum.trash}
                size={ESize.sm}
                color="text-gray-400"
                className="absolute end-3 top-3 cursor-pointer transition-colors hover:text-danger-500"
                handleClick={() => removeItem(line.id)}
            />
        </Div>
    );
}

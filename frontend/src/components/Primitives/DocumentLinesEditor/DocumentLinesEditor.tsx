'use client';

import { useTranslations } from 'next-intl';
import Input from '@/components/Primitives/Input/Input';
import Button from '@/components/Primitives/Button/Button';
import Label from '@/components/Primitives/Label/Label';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import { EButtonSize, EButtonType, EInputType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import type { DocumentLineInput } from '@/lib/sales-api';
import { computeDocumentPreview, computeLinePreview, formatMoney } from '@/lib/sales-api';

const EMPTY_LINE: DocumentLineInput = {
    label: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 19,
};

interface IDocumentLinesEditor {
    lines: DocumentLineInput[];
    onChange: (lines: DocumentLineInput[]) => void;
    disabled?: boolean;
}

export default function DocumentLinesEditor({
    lines,
    onChange,
    disabled = false,
}: Readonly<IDocumentLinesEditor>) {
    const t = useTranslations('sales.lines');
    const tCommon = useTranslations('common');

    const totals = computeDocumentPreview(lines);

    const updateLine = (index: number, patch: Partial<DocumentLineInput>) => {
        const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
        onChange(next);
    };

    const addLine = () => onChange([...lines, { ...EMPTY_LINE }]);

    const removeLine = (index: number) => {
        if (lines.length <= 1) return;
        onChange(lines.filter((_, i) => i !== index));
    };

    return (
        <Div className="flex flex-col gap-4">
            <Div className="flex items-center justify-between gap-2">
                <Label variant={EVariantLabel.h6} color="text-gray-900">
                    {t('title')}
                </Label>
                {!disabled && (
                    <Button
                        id="document-add-line"
                        type={EButtonType.secondary}
                        size={EButtonSize.small}
                        text={t('add')}
                        onClick={addLine}
                    />
                )}
            </Div>

            <Div className="space-y-4">
                {lines.map((line, index) => {
                    const preview = computeLinePreview(line);
                    return (
                        <Div
                            key={`line-${index}`}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                            <Div className="mb-3 flex items-start justify-between gap-2">
                                <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                    {t('title')} {index + 1}
                                </Label>
                                {!disabled && lines.length > 1 && (
                                    <Icon
                                        name={IconComponentsEnum.trash}
                                        size={ESize.lg}
                                        color="text-danger-500"
                                        className="cursor-pointer"
                                        handleClick={() => removeLine(index)}
                                    />
                                )}
                            </Div>
                            <Div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input
                                    id={`line-label-${index}`}
                                    label={t('label')}
                                    value={line.label}
                                    onChange={(e) => updateLine(index, { label: e.target.value })}
                                    disabled={disabled}
                                    required
                                />
                                <Input
                                    id={`line-desc-${index}`}
                                    label={tCommon('description')}
                                    value={line.description ?? ''}
                                    onChange={(e) => updateLine(index, { description: e.target.value })}
                                    disabled={disabled}
                                />
                                <Input
                                    id={`line-qty-${index}`}
                                    label={t('quantity')}
                                    type={EInputType.number}
                                    value={String(line.quantity)}
                                    onChange={(e) =>
                                        updateLine(index, { quantity: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    disabled={disabled}
                                />
                                <Input
                                    id={`line-price-${index}`}
                                    label={t('unitPrice')}
                                    type={EInputType.number}
                                    value={String(line.unitPrice)}
                                    onChange={(e) =>
                                        updateLine(index, { unitPrice: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    disabled={disabled}
                                />
                                <Input
                                    id={`line-tax-${index}`}
                                    label={t('taxRate')}
                                    type={EInputType.number}
                                    value={String(line.taxRate)}
                                    onChange={(e) =>
                                        updateLine(index, { taxRate: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    disabled={disabled}
                                />
                                <Div className="flex flex-col justify-end">
                                    <Label variant={EVariantLabel.hint} color="text-gray-500">
                                        {t('lineTotal')}
                                    </Label>
                                    <Label variant={EVariantLabel.bodyLarge} color="text-gray-900">
                                        {formatMoney(preview.lineTotal)}
                                    </Label>
                                </Div>
                            </Div>
                        </Div>
                    );
                })}
            </Div>

            <Div className="rounded-xl border border-gray-200 bg-white p-4">
                <Div className="flex flex-col gap-1 sm:ml-auto sm:max-w-xs">
                    <Div className="flex justify-between gap-4">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-600">{t('subtotal')}</Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(totals.subtotal)}</Label>
                    </Div>
                    <Div className="flex justify-between gap-4">
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-600">{t('tax')}</Label>
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{formatMoney(totals.taxTotal)}</Label>
                    </Div>
                    <Div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                        <Label variant={EVariantLabel.bodyLarge} color="text-gray-900">{t('total')}</Label>
                        <Label variant={EVariantLabel.bodyLarge} color="text-primary-600">{formatMoney(totals.total)}</Label>
                    </Div>
                </Div>
            </Div>
        </Div>
    );
}

export { EMPTY_LINE };

'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Div from '@/components/Primitives/Div/Div';
import Icon from '@/components/Primitives/Icon/Icon';
import Label from '@/components/Primitives/Label/Label';
import { formatMoney } from '@/lib/daily-income-api';
import { POS_TAX_RATES, round3, toAmount, type PosProduct } from '@/lib/pos-api';
import {
    draftAmounts,
    draftFromProduct,
    draftTotals,
    newDraftLine,
    taxesByRate,
    type DocumentLineDraft,
} from '@/lib/pos-documents';
import { ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';

const MENU_MAX_HEIGHT = 288;
const MENU_MIN_WIDTH = 320;

const CELL_INPUT =
    'w-full min-w-0 border-0 border-b border-transparent bg-transparent px-1 py-1.5 text-base text-gray-900 sm:text-sm outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-primary-500';

interface OrganismPosDocumentLinesProps {
    lines: DocumentLineDraft[];
    onChange?: (lines: DocumentLineDraft[]) => void;
    products?: PosProduct[];
    stampDuty?: number;
    amountPaid?: number;
    readOnly?: boolean;
    showErrors?: boolean;
}

interface MenuPosition {
    left: number;
    width: number;
    top?: number;
    bottom?: number;
}

function ProductPicker({
    line,
    products,
    autoFocus,
    error,
    onType,
    onPick,
}: Readonly<{
    line: DocumentLineDraft;
    products: PosProduct[];
    autoFocus: boolean;
    error: boolean;
    onType: (name: string) => void;
    onPick: (product: PosProduct) => void;
}>) {
    const t = useTranslations('pos.documents');
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [position, setPosition] = useState<MenuPosition | null>(null);

    const query = line.productName.trim().toLowerCase();
    const selected = line.productId ? products.find((p) => p.id === line.productId) : undefined;
    const matches = useMemo(() => {
        if (!query || selected?.name.toLowerCase() === query) return products;
        return products.filter(
            (p) => p.name.toLowerCase().includes(query) || p.reference?.toLowerCase().includes(query),
        );
    }, [products, query, selected]);
    const showFreeLine = !!query && !line.productId;

    const updatePosition = useCallback(() => {
        const input = inputRef.current;
        if (!input) return;
        const rect = input.getBoundingClientRect();
        const width = Math.min(Math.max(rect.width, MENU_MIN_WIDTH), window.innerWidth - 16);
        const preferredLeft = document.documentElement.dir === 'rtl' ? rect.right - width : rect.left;
        const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8));
        const spaceBelow = window.innerHeight - rect.bottom;
        setPosition(
            spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow
                ? { left, width, bottom: window.innerHeight - rect.top + 4 }
                : { left, width, top: rect.bottom + 4 },
        );
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (inputRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const pick = (product: PosProduct) => {
        onPick(product);
        setOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setHighlighted((index) => Math.min(index + 1, matches.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlighted((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter' && open) {
            event.preventDefault();
            const product = matches[highlighted];
            if (product) pick(product);
            else setOpen(false);
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            setOpen(false);
        }
    };

    const menu =
        open && position
            ? createPortal(
                  <div
                      ref={menuRef}
                      role="listbox"
                      style={{ position: 'fixed', ...position, zIndex: 100 }}
                      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                  >
                      <div className="overflow-y-auto py-1" style={{ maxHeight: MENU_MAX_HEIGHT }}>
                          {matches.map((product, index) => (
                              <button
                                  key={product.id}
                                  type="button"
                                  role="option"
                                  aria-selected={product.id === line.productId}
                                  onMouseEnter={() => setHighlighted(index)}
                                  onClick={() => pick(product)}
                                  className={twMerge(
                                      'flex w-full items-center justify-between gap-4 px-3 py-2 text-start transition-colors',
                                      index === highlighted && 'bg-primary-50',
                                  )}
                              >
                                  <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate">
                                      {product.name}
                                  </Label>
                                  <Label variant={EVariantLabel.caption} color="text-gray-500" className="shrink-0 tabular-nums">
                                      {formatMoney(toAmount(product.price))}
                                  </Label>
                              </button>
                          ))}
                          {matches.length === 0 ? (
                              <Label variant={EVariantLabel.bodySmall} color="text-gray-500" className="block px-3 py-2">
                                  {t('noProductMatch')}
                              </Label>
                          ) : null}
                      </div>
                      {showFreeLine ? (
                          <button
                              type="button"
                              onClick={() => setOpen(false)}
                              className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-start transition-colors hover:bg-gray-50"
                          >
                              <Icon name={IconComponentsEnum.edit} size={ESize.xs} color="text-primary-600" />
                              <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="truncate">
                                  {t('useAsFreeLine', { name: line.productName.trim() })}
                              </Label>
                          </button>
                      ) : null}
                  </div>,
                  document.body,
              )
            : null;

    return (
        <>
            <input
                ref={inputRef}
                id={`doc-line-product-${line.key}`}
                value={line.productName}
                placeholder={t('productPlaceholder')}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                onFocus={() => {
                    setHighlighted(0);
                    setOpen(true);
                }}
                onChange={(e) => {
                    onType(e.target.value);
                    setHighlighted(0);
                    setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={twMerge(CELL_INPUT, 'font-medium', error && 'border-danger-500 hover:border-danger-500')}
            />
            {menu}
        </>
    );
}

function TotalRow({
    label,
    value,
    strong = false,
}: Readonly<{ label: string; value: string; strong?: boolean }>) {
    return (
        <Div className="flex items-center justify-between gap-4 py-1 sm:gap-8">
            <Label
                variant={EVariantLabel.bodySmall}
                color={strong ? 'text-gray-900' : 'text-gray-600'}
                className={strong ? 'font-semibold' : ''}
            >
                {label}
            </Label>
            <Label
                variant={strong ? EVariantLabel.h6 : EVariantLabel.bodySmall}
                color="text-gray-900"
                className={twMerge('tabular-nums', strong && 'font-semibold')}
            >
                {value}
            </Label>
        </Div>
    );
}

export default function OrganismPosDocumentLines({
    lines,
    onChange,
    products = [],
    stampDuty = 0,
    amountPaid,
    readOnly = false,
    showErrors = false,
}: Readonly<OrganismPosDocumentLinesProps>) {
    const t = useTranslations('pos.documents');
    const [focusKey, setFocusKey] = useState<string | null>(null);

    const totals = draftTotals(lines);
    const taxes = taxesByRate(
        lines.map((line) => ({ taxRate: Number(line.taxRate) || 0, ...draftAmounts(line) })),
    );
    const grandTotal = round3(totals.total + stampDuty);

    const update = (key: string, patch: Partial<DocumentLineDraft>) =>
        onChange?.(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));

    const addLine = () => {
        const line = newDraftLine();
        setFocusKey(line.key);
        onChange?.([...lines, line]);
    };

    const numberInput = (line: DocumentLineDraft, field: 'quantity' | 'unitPrice' | 'discountPct', invalid = false) => (
        <input
            id={`doc-line-${field}-${line.key}`}
            value={line[field]}
            inputMode="decimal"
            autoComplete="off"
            onChange={(e) => update(line.key, { [field]: e.target.value.replace(/[^\d.,]/g, '') })}
            className={twMerge(CELL_INPUT, 'text-end tabular-nums', invalid && 'border-danger-500 hover:border-danger-500')}
        />
    );

    const columns = [
        { key: 'product', label: t('product'), className: 'w-[32%] text-start' },
        { key: 'description', label: t('description'), className: 'text-start' },
        { key: 'quantity', label: t('quantity'), className: 'w-24 text-end' },
        { key: 'unitPrice', label: t('unitPrice'), className: 'w-32 text-end' },
        { key: 'discount', label: t('discount'), className: 'w-20 text-end' },
        { key: 'tax', label: t('tax'), className: 'w-24 text-start' },
        { key: 'subtotal', label: t('subtotal'), className: 'w-32 text-end' },
    ];

    return (
        <Div className="space-y-6">
            <Div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[64rem] table-fixed border-collapse">
                    <thead>
                        <tr className="border-y border-gray-200 bg-gray-50">
                            {columns.map((column) => (
                                <th key={column.key} className={twMerge('px-3 py-2.5', column.className)}>
                                    <Label variant={EVariantLabel.caption} color="text-gray-700" className="font-semibold">
                                        {column.label}
                                    </Label>
                                </th>
                            ))}
                            {readOnly ? null : <th className="w-10" />}
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => {
                            const amounts = draftAmounts(line);
                            if (readOnly) {
                                return (
                                    <tr key={line.key} className="border-b border-gray-100">
                                        <td className="px-3 py-2.5">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium">
                                                {line.productName}
                                            </Label>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-600">
                                                {line.description}
                                            </Label>
                                        </td>
                                        <td className="px-3 py-2.5 text-end">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                                                {line.quantity}
                                            </Label>
                                        </td>
                                        <td className="px-3 py-2.5 text-end">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                                                {formatMoney(Number(line.unitPrice) || 0)}
                                            </Label>
                                        </td>
                                        <td className="px-3 py-2.5 text-end">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="tabular-nums">
                                                {Number(line.discountPct) ? `${line.discountPct}%` : ''}
                                            </Label>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {Number(line.taxRate) ? (
                                                <Label
                                                    variant={EVariantLabel.caption}
                                                    color="text-gray-700"
                                                    className="rounded-full bg-gray-100 px-2 py-0.5"
                                                >
                                                    {`${line.taxRate}%`}
                                                </Label>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-2.5 text-end">
                                            <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium tabular-nums">
                                                {formatMoney(amounts.subtotal)}
                                            </Label>
                                        </td>
                                    </tr>
                                );
                            }
                            return (
                                <tr key={line.key} className="group border-b border-gray-100 transition-colors hover:bg-gray-50">
                                    <td className="px-2 py-1">
                                        <ProductPicker
                                            line={line}
                                            products={products}
                                            autoFocus={focusKey === line.key}
                                            error={showErrors && !line.productName.trim()}
                                            onType={(name) => update(line.key, { productName: name, productId: null })}
                                            onPick={(product) =>
                                                onChange?.(
                                                    lines.map((l) => (l.key === line.key ? draftFromProduct(l, product) : l)),
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            id={`doc-line-description-${line.key}`}
                                            value={line.description}
                                            autoComplete="off"
                                            onChange={(e) => update(line.key, { description: e.target.value })}
                                            className={CELL_INPUT}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        {numberInput(line, 'quantity', showErrors && !(Number(line.quantity) > 0))}
                                    </td>
                                    <td className="px-2 py-1">{numberInput(line, 'unitPrice')}</td>
                                    <td className="px-2 py-1">{numberInput(line, 'discountPct')}</td>
                                    <td className="px-2 py-1">
                                        <select
                                            id={`doc-line-tax-${line.key}`}
                                            value={String(Number(line.taxRate) || 0)}
                                            onChange={(e) => update(line.key, { taxRate: e.target.value })}
                                            className={twMerge(CELL_INPUT, 'cursor-pointer')}
                                        >
                                            {POS_TAX_RATES.map((rate) => (
                                                <option key={rate} value={String(rate)}>
                                                    {`${rate}%`}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-3 py-1 text-end">
                                        <Label variant={EVariantLabel.bodySmall} color="text-gray-900" className="font-medium tabular-nums">
                                            {formatMoney(amounts.subtotal)}
                                        </Label>
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                        <Icon
                                            name={IconComponentsEnum.trash}
                                            size={ESize.sm}
                                            color="text-gray-400"
                                            className="-m-2 box-content cursor-pointer p-2 transition-opacity hover:text-danger-600 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
                                            handleClick={() => onChange?.(lines.filter((l) => l.key !== line.key))}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        {readOnly && lines.length === 0 ? (
                            <tr className="border-b border-gray-100">
                                <td colSpan={columns.length} className="px-3 py-6 text-center">
                                    <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                                        {t('noLines')}
                                    </Label>
                                </td>
                            </tr>
                        ) : null}
                        {readOnly ? null : (
                            <tr className="border-b border-gray-100">
                                <td colSpan={columns.length + 1} className="px-3 py-2.5">
                                    <button type="button" id="doc-add-line" onClick={addLine} className="min-h-11 hover:underline sm:min-h-0">
                                        <Label variant={EVariantLabel.bodySmall} color="text-primary-600" className="font-medium">
                                            {t('addLine')}
                                        </Label>
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Div>

            <Div className="flex justify-end">
                <Div className="w-full sm:w-80">
                    <TotalRow label={t('untaxed')} value={formatMoney(totals.untaxed)} />
                    {taxes.map((tax) => (
                        <TotalRow
                            key={tax.rate}
                            label={t('taxLine', { rate: tax.rate })}
                            value={formatMoney(tax.tax)}
                        />
                    ))}
                    {stampDuty > 0 ? <TotalRow label={t('stampDuty')} value={formatMoney(stampDuty)} /> : null}
                    <Div className="mt-1 border-t border-gray-200 pt-1">
                        <TotalRow label={t('total')} value={formatMoney(grandTotal)} strong />
                    </Div>
                    {amountPaid !== undefined && amountPaid > 0 ? (
                        <>
                            <TotalRow label={t('amountPaid')} value={formatMoney(amountPaid)} />
                            <TotalRow
                                label={t('amountDue')}
                                value={formatMoney(round3(grandTotal - amountPaid))}
                                strong
                            />
                        </>
                    ) : null}
                </Div>
            </Div>
        </Div>
    );
}

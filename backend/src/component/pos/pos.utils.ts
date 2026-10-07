import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const POS_AUDIT = {
  category: 'POS_CATEGORY',
  product: 'POS_PRODUCT',
  session: 'POS_SESSION',
  order: 'POS_ORDER',
  saleOrder: 'SALE_ORDER',
  invoice: 'INVOICE',
  subscription: 'SUBSCRIPTION',
} as const;

export const EPSILON = 0.0005;

export const STAMP_DUTY = 1;

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function sumBy<T>(items: T[], pick: (item: T) => unknown): number {
  return round3(items.reduce((sum, item) => sum + Number(pick(item) ?? 0), 0));
}

export function formatOrderNumber(value: number): string {
  return String(value).padStart(4, '0');
}

export function formatSaleNumber(value: number): string {
  return `S${String(value).padStart(5, '0')}`;
}

export function formatSubscriptionNumber(value: number): string {
  return `ABN${String(value).padStart(5, '0')}`;
}

export function formatInvoiceNumber(
  type: 'INVOICE' | 'CREDIT_NOTE',
  year: number | null,
  sequence: number | null,
): string {
  if (year === null || sequence === null) return '/';
  return `${type === 'CREDIT_NOTE' ? 'AV' : 'FAC'}/${year}/${String(sequence).padStart(5, '0')}`;
}

/** Prices are tax-excluded: subtotal is HT, total is TTC. */
export function lineAmounts(quantity: number, unitPrice: number, discountPct: number, taxRate: number) {
  const subtotal = round3(quantity * unitPrice * (1 - discountPct / 100));
  const taxAmount = round3((subtotal * taxRate) / 100);
  return { subtotal, taxAmount, total: round3(subtotal + taxAmount) };
}

export interface DocumentLineInput {
  productId?: string | null;
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountPct?: number;
  taxRate?: number;
}

export function buildDocumentLines(lines: DocumentLineInput[]) {
  const built = lines.map((line, index) => {
    const discountPct = line.discountPct ?? 0;
    const taxRate = line.taxRate ?? 0;
    return {
      productId: line.productId || null,
      productName: line.productName.trim(),
      description: line.description?.trim() || null,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPct,
      taxRate,
      sortOrder: index,
      ...lineAmounts(line.quantity, line.unitPrice, discountPct, taxRate),
    };
  });
  return {
    lines: built,
    untaxed: sumBy(built, (l) => l.subtotal),
    taxTotal: sumBy(built, (l) => l.taxAmount),
    total: sumBy(built, (l) => l.total),
  };
}

export function toDateOnly(value: string | Date): Date {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Last day covered by a period starting on `start` (inclusive), e.g. 1 month from 07/10 ends 06/11. */
export function periodEnd(start: Date, duration: number, unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'): Date {
  if (unit === 'DAY' || unit === 'WEEK') {
    return addDays(start, duration * (unit === 'WEEK' ? 7 : 1) - 1);
  }
  const months = unit === 'YEAR' ? duration * 12 : duration;
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return addDays(target, -1);
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function validateBody<T extends object>(
  cls: new () => T,
  body: object,
  res: Response,
): Promise<T | null> {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto as object);
  if (errors.length > 0) {
    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors: errors.map((err) => ({
        field: err.property,
        errors: Object.values(err.constraints || {}),
      })),
    });
    return null;
  }
  return dto;
}

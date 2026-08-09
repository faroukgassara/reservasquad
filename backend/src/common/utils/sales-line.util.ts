import { Prisma } from 'src/generated/prisma/client';

export interface SalesLineInput {
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface ComputedSalesLine extends SalesLineInput {
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export function computeLineTotals(line: SalesLineInput): ComputedSalesLine {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const taxRate = Number(line.taxRate) || 0;
  const lineSubtotal = roundMoney(quantity * unitPrice);
  const lineTax = roundMoney(lineSubtotal * (taxRate / 100));
  const lineTotal = roundMoney(lineSubtotal + lineTax);
  return { quantity, unitPrice, taxRate, lineSubtotal, lineTax, lineTotal };
}

export function computeDocumentTotals(lines: ComputedSalesLine[]) {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.lineSubtotal, 0));
  const taxTotal = roundMoney(lines.reduce((sum, l) => sum + l.lineTax, 0));
  const total = roundMoney(subtotal + taxTotal);
  return { subtotal, taxTotal, total };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

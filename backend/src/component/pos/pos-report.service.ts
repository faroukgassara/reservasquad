import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { SalesDetailsQueryDto } from 'src/dto/pos/posReport.dto';
import { round3 } from './pos.utils';

@Injectable()
export class PosReportService {
  constructor(private readonly prismaService: PrismaService) {}

  private async resolveRange(query: SalesDetailsQueryDto) {
    if (query.sessionId) {
      const session = await this.prismaService.posSession.findUnique({
        where: { id: query.sessionId },
        select: { id: true, number: true, openedAt: true, closedAt: true },
      });
      if (!session) throw new NotFoundException('Session not found');
      return {
        from: session.openedAt,
        to: session.closedAt ?? new Date(),
        session: { id: session.id, number: session.number },
        where: { sessionId: session.id } satisfies Prisma.PosOrderWhereInput,
      };
    }
    if (!query.from || !query.to) throw new BadRequestException('A period or a session is required');
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to < from) throw new BadRequestException('The end date must be after the start date');
    return {
      from,
      to,
      session: null,
      where: { createdAt: { gte: from, lte: to } } satisfies Prisma.PosOrderWhereInput,
    };
  }

  async salesDetails(query: SalesDetailsQueryDto) {
    const { from, to, session, where } = await this.resolveRange(query);

    const orders = await this.prismaService.posOrder.findMany({
      where,
      select: {
        total: true,
        change: true,
        lines: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            discountPct: true,
            total: true,
            product: { select: { taxRate: true } },
          },
        },
        payments: { select: { method: true, amount: true } },
      },
    });

    const products = new Map<
      string,
      { name: string; quantity: number; unitPrice: number; discountPct: number; total: number }
    >();
    const payments = new Map<string, number>();
    const taxes = new Map<number, { rate: number; base: number; tax: number }>();

    for (const order of orders) {
      for (const line of order.lines) {
        const unitPrice = Number(line.unitPrice);
        const discountPct = Number(line.discountPct);
        const key = `${line.productId ?? line.productName}|${unitPrice}|${discountPct}`;
        const product = products.get(key) ?? { name: line.productName, quantity: 0, unitPrice, discountPct, total: 0 };
        product.quantity = round3(product.quantity + Number(line.quantity));
        product.total = round3(product.total + Number(line.total));
        products.set(key, product);

        const rate = Number(line.product?.taxRate ?? 0);
        const lineTotal = Number(line.total);
        const base = round3(lineTotal / (1 + rate / 100));
        const tax = taxes.get(rate) ?? { rate, base: 0, tax: 0 };
        tax.base = round3(tax.base + base);
        tax.tax = round3(tax.tax + lineTotal - base);
        taxes.set(rate, tax);
      }
      let change = Number(order.change);
      for (const payment of order.payments) {
        let amount = Number(payment.amount);
        if (payment.method === 'CASH' && change > 0) {
          const deducted = Math.min(change, amount);
          amount -= deducted;
          change -= deducted;
        }
        payments.set(payment.method, round3((payments.get(payment.method) ?? 0) + amount));
      }
    }

    return {
      from,
      to,
      session,
      ordersCount: orders.length,
      products: [...products.values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.unitPrice - b.unitPrice || a.discountPct - b.discountPct,
      ),
      payments: [...payments.entries()].map(([method, total]) => ({ method, total })),
      taxes: [...taxes.values()].sort((a, b) => a.rate - b.rate),
      total: round3(orders.reduce((sum, order) => sum + Number(order.total), 0)),
    };
  }
}

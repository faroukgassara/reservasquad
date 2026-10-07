import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EPosPaymentMethod, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import {
  CreatePosOrderDto,
  FetchPosOrdersDto,
  RefundPosOrderDto,
} from 'src/dto/pos/posOrder.dto';
import { AuditService } from '../audit/audit.service';
import {
  EPSILON,
  formatInvoiceNumber,
  formatOrderNumber,
  formatSaleNumber,
  formatSubscriptionNumber,
  POS_AUDIT,
  round3,
  sumBy,
} from './pos.utils';

const userSelect = { id: true, firstName: true, lastName: true } satisfies Prisma.UserSelect;
const clientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
} satisfies Prisma.CreditClientSelect;

const orderListInclude = {
  cashier: { select: userSelect },
  creditClient: { select: clientSelect },
  payments: { select: { id: true, method: true, amount: true } },
  session: { select: { id: true, number: true } },
  refundOf: { select: { id: true, number: true } },
} satisfies Prisma.PosOrderInclude;

const orderDetailInclude = {
  ...orderListInclude,
  lines: {
    orderBy: { id: 'asc' },
    include: { refundLines: { select: { quantity: true } } },
  },
  refunds: { select: { id: true, number: true, total: true, createdAt: true } },
} satisfies Prisma.PosOrderInclude;

type OrderDetail = Prisma.PosOrderGetPayload<{ include: typeof orderDetailInclude }>;

function lineTotal(quantity: number, unitPrice: number, discountPct: number): number {
  return round3(quantity * unitPrice * (1 - discountPct / 100));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

@Injectable()
export class PosOrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private withRefundable(order: OrderDetail) {
    return {
      ...order,
      lines: order.lines.map(({ refundLines, ...line }) => {
        const refunded = round3(Math.abs(sumBy(refundLines, (r) => r.quantity)));
        return {
          ...line,
          refundedQuantity: refunded,
          refundableQuantity:
            order.status === 'PAID' ? Math.max(0, round3(Number(line.quantity) - refunded)) : 0,
        };
      }),
    };
  }

  private async getOpenSession(tx: Prisma.TransactionClient) {
    const session = await tx.posSession.findFirst({
      where: { status: 'OPEN' },
      select: { id: true },
    });
    if (!session) throw new BadRequestException('No open session');
    return session;
  }

  async list(query: FetchPosOrdersDto, pagination: PaginationData) {
    const search = query.search?.trim();
    const searchNumber = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const createdAt: Prisma.DateTimeFilter | undefined =
      query.from || query.to
        ? {
            ...(query.from && { gte: new Date(query.from) }),
            ...(query.to && { lt: new Date(query.to) }),
          }
        : undefined;

    const where: Prisma.PosOrderWhereInput = {
      ...(query.sessionId && { sessionId: query.sessionId }),
      ...(query.creditClientId && { creditClientId: query.creditClientId }),
      ...(query.status && { status: query.status }),
      ...(createdAt && { createdAt }),
      ...(search && {
        OR: [
          ...(searchNumber !== undefined && searchNumber <= 2147483647
            ? [{ number: searchNumber }]
            : []),
          { creditClient: { firstName: { contains: search, mode: 'insensitive' } } },
          { creditClient: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const proxied = ProxyPrismaModel(this.prismaService.posOrder as any);
    return proxied.findManyPaginated(
      { where, orderBy: [{ createdAt: 'desc' }], include: orderListInclude },
      pagination,
    );
  }

  async getById(id: string) {
    const order = await this.prismaService.posOrder.findUnique({
      where: { id },
      include: orderDetailInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.withRefundable(order);
  }

  async create(dto: CreatePosOrderDto, actorId?: string) {
    const isFullCredit =
      dto.payments.length > 0 &&
      dto.payments.every((p) => p.method === 'CLIENT_ACCOUNT') &&
      dto.lines.every(
        (l) => l.productId && !l.saleOrderId && !l.subscriptionId && !l.creditId && !l.invoiceId,
      );
    if (isFullCredit) {
      if (!dto.creditClientId) {
        throw new BadRequestException('A client is required for client account payments');
      }
      return this.createOnCredit({ lines: dto.lines, creditClientId: dto.creditClientId }, actorId);
    }

    const order = await this.prismaService.$transaction(async (tx) => {
      const session = await this.getOpenSession(tx);

      const productIds = [
        ...new Set(dto.lines.map((l) => l.productId).filter((id): id is string => !!id)),
      ];
      const products = await tx.posProduct.findMany({
        where: { id: { in: productIds }, deletedAt: null, subscriptionDuration: null },
        select: { id: true, name: true, type: true },
      });
      const productById = new Map(products.map((p) => [p.id, p]));
      if (productById.size !== productIds.length) {
        throw new BadRequestException('Some products are unavailable');
      }

      const saleOrderIds = [
        ...new Set(dto.lines.map((l) => l.saleOrderId).filter((id): id is string => !!id)),
      ];
      const saleOrders = await tx.saleOrder.findMany({
        where: { id: { in: saleOrderIds }, deletedAt: null, status: 'CONFIRMED' },
        select: { id: true, number: true, clientId: true, total: true, amountPaid: true },
      });
      const saleOrderById = new Map(saleOrders.map((o) => [o.id, o]));
      if (saleOrderById.size !== saleOrderIds.length) {
        throw new BadRequestException('Some sale orders are not confirmed');
      }

      const subscriptionIds = [
        ...new Set(dto.lines.map((l) => l.subscriptionId).filter((id): id is string => !!id)),
      ];
      const subscriptions = await tx.subscription.findMany({
        where: { id: { in: subscriptionIds }, deletedAt: null, status: { in: ['DRAFT', 'ACTIVE'] } },
        select: { id: true, number: true, status: true, clientId: true, total: true, amountPaid: true },
      });
      const subscriptionById = new Map(subscriptions.map((s) => [s.id, s]));
      if (subscriptionById.size !== subscriptionIds.length) {
        throw new BadRequestException('Some subscriptions cannot be paid');
      }

      const invoiceLines = dto.lines.filter((l) => l.invoiceId);
      const invoiceIds = [...new Set(invoiceLines.map((l) => l.invoiceId!))];
      if (invoiceIds.length !== invoiceLines.length) {
        throw new BadRequestException('An invoice can only be paid once per order');
      }
      const invoices = await tx.invoice.findMany({
        where: { id: { in: invoiceIds }, type: 'INVOICE', status: 'POSTED', deletedAt: null },
        select: {
          id: true,
          type: true,
          year: true,
          sequence: true,
          clientId: true,
          total: true,
          amountPaid: true,
          saleOrderId: true,
          subscriptionId: true,
        },
      });
      const invoiceById = new Map(invoices.map((i) => [i.id, i]));
      if (invoiceById.size !== invoiceIds.length) {
        throw new BadRequestException('Some invoices cannot be paid');
      }

      const creditLines = dto.lines.filter((l) => l.creditId);
      const creditIds = [...new Set(creditLines.map((l) => l.creditId!))];
      if (creditIds.length !== creditLines.length) {
        throw new BadRequestException('A credit can only be paid once per order');
      }
      const credits = await tx.credit.findMany({
        where: { id: { in: creditIds }, deletedAt: null, client: { deletedAt: null } },
        include: { payments: { where: { deletedAt: null }, select: { amount: true } } },
      });
      const creditById = new Map(credits.map((c) => [c.id, c]));
      if (creditById.size !== creditIds.length) {
        throw new BadRequestException('Some credits are unavailable');
      }
      for (const line of creditLines) {
        const credit = creditById.get(line.creditId!)!;
        const remaining = round2(Number(credit.amount) - sumBy(credit.payments, (p) => p.amount));
        if (line.quantity !== 1) throw new BadRequestException('Document lines must have a quantity of 1');
        if (Math.abs(round2(line.unitPrice) - line.unitPrice) > EPSILON) {
          throw new BadRequestException('Credit payments are limited to 2 decimals');
        }
        if (line.unitPrice <= 0 || line.unitPrice > remaining + EPSILON) {
          throw new BadRequestException('Amount exceeds what remains on the credit');
        }
      }

      const lines = dto.lines.map((line) => {
        if (line.invoiceId) {
          if (line.saleOrderId || line.subscriptionId || line.creditId) {
            throw new BadRequestException('An invoice line cannot settle another document');
          }
          if (line.quantity !== 1) throw new BadRequestException('Document lines must have a quantity of 1');
          const invoice = invoiceById.get(line.invoiceId)!;
          return {
            productId: null,
            saleOrderId: null,
            subscriptionId: null,
            creditId: null,
            invoiceId: invoice.id,
            productName: formatInvoiceNumber(invoice.type, invoice.year, invoice.sequence),
            quantity: 1,
            unitPrice: line.unitPrice,
            discountPct: 0,
            total: round3(line.unitPrice),
          };
        }
        if (line.creditId) {
          if (line.saleOrderId || line.subscriptionId) {
            throw new BadRequestException('A credit settlement line cannot settle a document');
          }
          const credit = creditById.get(line.creditId)!;
          return {
            productId: null,
            saleOrderId: null,
            subscriptionId: null,
            invoiceId: null,
            creditId: credit.id,
            productName: credit.description || credit.date.toISOString().slice(0, 10),
            quantity: 1,
            unitPrice: line.unitPrice,
            discountPct: 0,
            total: round3(line.unitPrice),
          };
        }
        if (line.saleOrderId || line.subscriptionId) {
          if (line.saleOrderId && line.subscriptionId) {
            throw new BadRequestException('A line cannot settle a sale order and a subscription');
          }
          if (line.quantity !== 1) throw new BadRequestException('Document lines must have a quantity of 1');
          return {
            productId: null,
            saleOrderId: line.saleOrderId ?? null,
            subscriptionId: line.subscriptionId ?? null,
            creditId: null,
            invoiceId: null,
            productName: line.saleOrderId
              ? formatSaleNumber(saleOrderById.get(line.saleOrderId)!.number)
              : formatSubscriptionNumber(subscriptionById.get(line.subscriptionId!)!.number),
            quantity: 1,
            unitPrice: line.unitPrice,
            discountPct: 0,
            total: round3(line.unitPrice),
          };
        }
        const discountPct = line.discountPct ?? 0;
        return {
          productId: line.productId!,
          saleOrderId: null,
          subscriptionId: null,
          creditId: null,
          invoiceId: null,
          productName: productById.get(line.productId!)!.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPct,
          total: lineTotal(line.quantity, line.unitPrice, discountPct),
        };
      });
      const total = sumBy(lines, (l) => l.total);
      if (total < 0) throw new BadRequestException('Order total cannot be negative');

      const settledBy = (key: 'saleOrderId' | 'subscriptionId' | 'invoiceId') => {
        const settled = new Map<string, number>();
        for (const line of lines) {
          const id = line[key];
          if (id) settled.set(id, round3((settled.get(id) ?? 0) + line.total));
        }
        return settled;
      };
      const settledBySaleOrder = settledBy('saleOrderId');
      const settledBySubscription = settledBy('subscriptionId');
      const settledByInvoice = settledBy('invoiceId');

      const creditClientId =
        dto.creditClientId ??
        invoices[0]?.clientId ??
        saleOrders[0]?.clientId ??
        subscriptions[0]?.clientId ??
        credits[0]?.clientId;
      if (credits.some((c) => c.clientId !== creditClientId)) {
        throw new BadRequestException('The client does not match the credit');
      }
      /** Unpaid rest moved to the client credit account, per document, when a deposit line asks for it. */
      const restToCredit = (
        key: 'saleOrderId' | 'subscriptionId' | 'invoiceId',
        id: string,
        remaining: number,
        amount: number,
      ) => (dto.lines.some((l) => l[key] === id && l.creditRemainder) ? Math.max(0, round3(remaining - amount)) : 0);
      const creditRestBySaleOrder = new Map<string, number>();
      const creditRestBySubscription = new Map<string, number>();
      const creditRestByInvoice = new Map<string, number>();
      for (const [invoiceId, amount] of settledByInvoice) {
        const invoice = invoiceById.get(invoiceId)!;
        const remaining = round3(Number(invoice.total) - Number(invoice.amountPaid));
        if (amount > remaining + EPSILON) {
          throw new BadRequestException('Amount exceeds what remains on the invoice');
        }
        if (creditClientId !== invoice.clientId) {
          throw new BadRequestException('The client does not match the invoice');
        }
        creditRestByInvoice.set(invoiceId, restToCredit('invoiceId', invoiceId, remaining, amount));
      }
      for (const [saleOrderId, amount] of settledBySaleOrder) {
        const saleOrder = saleOrderById.get(saleOrderId)!;
        const remaining = round3(Number(saleOrder.total) - Number(saleOrder.amountPaid));
        if (amount > remaining + EPSILON) {
          throw new BadRequestException('Amount exceeds what remains on the sale order');
        }
        if (creditClientId !== saleOrder.clientId) {
          throw new BadRequestException('The client does not match the sale order');
        }
        creditRestBySaleOrder.set(saleOrderId, restToCredit('saleOrderId', saleOrderId, remaining, amount));
      }
      for (const [subscriptionId, amount] of settledBySubscription) {
        const subscription = subscriptionById.get(subscriptionId)!;
        const remaining = round3(Number(subscription.total) - Number(subscription.amountPaid));
        if (amount > remaining + EPSILON) {
          throw new BadRequestException('Amount exceeds what remains on the subscription');
        }
        if (creditClientId !== subscription.clientId) {
          throw new BadRequestException('The client does not match the subscription');
        }
        creditRestBySubscription.set(subscriptionId, restToCredit('subscriptionId', subscriptionId, remaining, amount));
      }

      const amountFor = (method: EPosPaymentMethod) =>
        sumBy(dto.payments.filter((p) => p.method === method), (p) => p.amount);
      const cash = amountFor('CASH');
      const nonCash = round3(amountFor('BANK') + amountFor('CLIENT_ACCOUNT'));
      const amountPaid = round3(cash + nonCash);

      if (nonCash > total + EPSILON) {
        throw new BadRequestException('Only cash payments can exceed the total');
      }
      if (amountPaid + EPSILON < total) {
        throw new BadRequestException('Payments do not cover the total');
      }
      const change = round3(amountPaid - total);

      const clientAccountAmount = amountFor('CLIENT_ACCOUNT');
      let client: { id: string; firstName: string; lastName: string } | null = null;
      if (creditClientId) {
        client = await tx.creditClient.findFirst({
          where: { id: creditClientId, deletedAt: null },
          select: { id: true, firstName: true, lastName: true },
        });
        if (!client) throw new BadRequestException('Client not found');
      }
      if (clientAccountAmount > 0 && !client) {
        throw new BadRequestException('A client is required for client account payments');
      }
      if (clientAccountAmount > 0 && creditLines.length > 0) {
        throw new BadRequestException('A credit settlement cannot be paid on the client account');
      }

      const created = await tx.posOrder.create({
        data: {
          sessionId: session.id,
          cashierId: actorId || null,
          creditClientId: client?.id ?? null,
          note: dto.note?.trim() || null,
          total,
          amountPaid,
          change,
          lines: { create: lines },
          payments: {
            create: dto.payments.map((p) => ({ method: p.method, amount: p.amount })),
          },
        },
        include: {
          payments: true,
          lines: { select: { id: true, creditId: true, invoiceId: true, total: true } },
        },
      });

      for (const line of created.lines) {
        if (!line.creditId) continue;
        await tx.creditPayment.create({
          data: {
            creditId: line.creditId,
            date: startOfToday(),
            amount: round2(Number(line.total)).toFixed(2),
            note: `Caisse - Commande ${formatOrderNumber(created.number)}`,
            posOrderLineId: line.id,
          },
        });
      }

      if (clientAccountAmount > 0 && client) {
        const credit = await tx.credit.create({
          data: {
            clientId: client.id,
            date: startOfToday(),
            amount: clientAccountAmount.toFixed(2),
            description: `Caisse - Commande ${formatOrderNumber(created.number)}`,
          },
        });
        await tx.posPayment.updateMany({
          where: { orderId: created.id, method: 'CLIENT_ACCOUNT' },
          data: { creditId: credit.id },
        });
      }

      for (const line of lines) {
        if (!line.productId) continue;
        await tx.posProduct.update({
          where: { id: line.productId },
          data: { stockQty: { decrement: line.quantity } },
        });
      }

      const today = startOfToday();
      const invoiceMethod = cash > 0 ? 'CASH' : 'BANK';
      const payLinkedInvoice = async (origin: Prisma.InvoiceWhereInput, amount: number) => {
        const invoice = await tx.invoice.findFirst({
          where: { ...origin, type: 'INVOICE', status: { not: 'CANCELLED' }, deletedAt: null },
          select: { id: true, total: true, amountPaid: true },
        });
        const invoiceAmount = invoice
          ? round3(Math.min(amount, Number(invoice.total) - Number(invoice.amountPaid)))
          : 0;
        if (!invoice || invoiceAmount <= 0) return;
        await tx.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            date: today,
            method: invoiceMethod,
            amount: invoiceAmount,
            note: `Caisse - Commande ${formatOrderNumber(created.number)}`,
            createdById: actorId || null,
          },
        });
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { amountPaid: { increment: invoiceAmount } },
        });
      };

      const creditRest = async (documentNumber: string, amount: number) => {
        if (amount <= 0) return;
        await tx.credit.create({
          data: {
            clientId: client!.id,
            date: today,
            amount: amount.toFixed(2),
            description: `Reste ${documentNumber} - Commande ${formatOrderNumber(created.number)}`,
          },
        });
      };

      for (const line of created.lines) {
        if (!line.invoiceId) continue;
        const invoice = invoiceById.get(line.invoiceId)!;
        const amount = round3(Number(line.total));
        const rest = creditRestByInvoice.get(invoice.id) ?? 0;
        const paid = round3(amount + rest);
        const payment = {
          invoiceId: invoice.id,
          date: today,
          note: `Caisse - Commande ${formatOrderNumber(created.number)}`,
          createdById: actorId || null,
          posOrderLineId: line.id,
        };
        await tx.invoicePayment.create({ data: { ...payment, method: invoiceMethod, amount } });
        if (rest > 0) {
          await tx.invoicePayment.create({ data: { ...payment, method: 'CLIENT_ACCOUNT', amount: rest } });
          await creditRest(formatInvoiceNumber(invoice.type, invoice.year, invoice.sequence), rest);
        }
        await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: { increment: paid } } });
        if (invoice.saleOrderId) {
          await tx.saleOrder.update({
            where: { id: invoice.saleOrderId },
            data: { amountPaid: { increment: paid } },
          });
        }
        if (invoice.subscriptionId) {
          await tx.subscription.update({
            where: { id: invoice.subscriptionId },
            data: { amountPaid: { increment: paid } },
          });
          await tx.subscription.updateMany({
            where: { id: invoice.subscriptionId, status: 'DRAFT' },
            data: { status: 'ACTIVE', activatedAt: new Date() },
          });
        }
      }

      for (const [saleOrderId, amount] of settledBySaleOrder) {
        const rest = creditRestBySaleOrder.get(saleOrderId) ?? 0;
        await tx.saleOrder.update({
          where: { id: saleOrderId },
          data: { amountPaid: { increment: round3(amount + rest) } },
        });
        await payLinkedInvoice({ saleOrderId }, amount);
        await creditRest(formatSaleNumber(saleOrderById.get(saleOrderId)!.number), rest);
      }
      for (const [subscriptionId, amount] of settledBySubscription) {
        const subscription = subscriptionById.get(subscriptionId)!;
        const rest = creditRestBySubscription.get(subscriptionId) ?? 0;
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: {
            amountPaid: { increment: round3(amount + rest) },
            ...(subscription.status === 'DRAFT' && { status: 'ACTIVE', activatedAt: new Date() }),
          },
        });
        await payLinkedInvoice({ subscriptionId }, amount);
        await creditRest(formatSubscriptionNumber(subscription.number), rest);
      }

      return created;
    });

    await this.auditService.log({
      entityType: POS_AUDIT.order,
      entityId: order.id,
      action: 'CREATE',
      userId: actorId,
      summary: `POS order ${formatOrderNumber(order.number)} paid (${order.total.toString()})`,
    });
    return this.getById(order.id);
  }

  /** Products paid fully on client credit become credits, not a register order. */
  private async createOnCredit(dto: { lines: CreatePosOrderDto['lines']; creditClientId: string }, actorId?: string) {
    const { client, credits } = await this.prismaService.$transaction(async (tx) => {
      const client = await tx.creditClient.findFirst({
        where: { id: dto.creditClientId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!client) throw new BadRequestException('Client not found');

      const productIds = [...new Set(dto.lines.map((l) => l.productId))];
      if (productIds.some((id) => !id) || dto.lines.some((l) => l.saleOrderId || l.subscriptionId || l.creditId)) {
        throw new BadRequestException('Only products can be sold on credit');
      }
      const products = await tx.posProduct.findMany({
        where: { id: { in: productIds as string[] }, deletedAt: null, subscriptionDuration: null },
        select: { id: true, name: true },
      });
      const productById = new Map(products.map((p) => [p.id, p]));
      if (productById.size !== productIds.length) {
        throw new BadRequestException('Some products are unavailable');
      }

      const today = startOfToday();
      const credits: { id: string; amount: Prisma.Decimal }[] = [];
      for (const line of dto.lines) {
        if (line.quantity <= 0) throw new BadRequestException('Returns cannot be sold on credit');
        const amount = round2(lineTotal(line.quantity, line.unitPrice, line.discountPct ?? 0));
        if (amount <= 0) throw new BadRequestException('Credit amount must be positive');
        const product = productById.get(line.productId!)!;
        await tx.posProduct.update({
          where: { id: product.id },
          data: { stockQty: { decrement: line.quantity } },
        });
        credits.push(
          await tx.credit.create({
            data: {
              clientId: client.id,
              date: today,
              amount: amount.toFixed(2),
              description: line.quantity === 1 ? product.name : `${line.quantity} x ${product.name}`,
              productId: product.id,
              quantity: line.quantity,
            },
            select: { id: true, amount: true },
          }),
        );
      }
      return { client, credits };
    });

    for (const credit of credits) {
      await this.auditService.log({
        entityType: 'CREDIT',
        entityId: credit.id,
        action: 'CREATE',
        userId: actorId,
        summary: `Register sale on credit of ${credit.amount.toString()} for ${client.firstName} ${client.lastName}`,
      });
    }
    return {
      onCredit: true as const,
      clientId: client.id,
      count: credits.length,
      total: round2(sumBy(credits, (c) => c.amount)),
    };
  }

  async refund(id: string, dto: RefundPosOrderDto, actorId?: string) {
    const { refund, original, total } = await this.prismaService.$transaction(async (tx) => {
      const found = await tx.posOrder.findUnique({ where: { id }, include: orderDetailInclude });
      if (!found) throw new NotFoundException('Order not found');
      const original = this.withRefundable(found);
      if (original.status !== 'PAID') {
        throw new BadRequestException('Only paid orders can be refunded');
      }
      const session = await this.getOpenSession(tx);
      const lineById = new Map(original.lines.map((l) => [l.id, l]));

      const refundLines = dto.lines.map((requested) => {
        const line = lineById.get(requested.lineId);
        if (!line) throw new BadRequestException('Line does not belong to this order');
        if (requested.quantity > line.refundableQuantity + EPSILON) {
          throw new BadRequestException('Refund quantity exceeds the remaining quantity');
        }
        if ((line.creditId || line.invoiceId) && Math.abs(requested.quantity - line.refundableQuantity) > EPSILON) {
          throw new BadRequestException('Credit and invoice settlements can only be refunded in full');
        }
        const unitPrice = Number(line.unitPrice);
        const discountPct = Number(line.discountPct);
        return {
          productId: line.productId,
          saleOrderId: line.saleOrderId,
          subscriptionId: line.subscriptionId,
          creditId: line.creditId,
          invoiceId: line.invoiceId,
          productName: line.productName,
          quantity: -requested.quantity,
          unitPrice,
          discountPct,
          total: lineTotal(-requested.quantity, unitPrice, discountPct),
          refundOfLineId: line.id,
        };
      });
      const total = sumBy(refundLines, (l) => l.total);

      const created = await tx.posOrder.create({
        data: {
          sessionId: session.id,
          cashierId: actorId || null,
          creditClientId: original.creditClientId,
          status: 'REFUND',
          refundOfId: original.id,
          total,
          amountPaid: total,
          change: 0,
          lines: { create: refundLines },
          payments: { create: [{ method: dto.method, amount: total }] },
        },
      });

      for (const line of refundLines) {
        if (!line.productId) continue;
        await tx.posProduct.update({
          where: { id: line.productId },
          data: { stockQty: { increment: -line.quantity } },
        });
      }

      for (const line of refundLines) {
        if (line.saleOrderId) {
          await tx.saleOrder.update({
            where: { id: line.saleOrderId },
            data: { amountPaid: { decrement: Math.abs(line.total) } },
          });
        }
        if (line.subscriptionId) {
          await tx.subscription.update({
            where: { id: line.subscriptionId },
            data: { amountPaid: { decrement: Math.abs(line.total) } },
          });
        }
        if (line.creditId) {
          await tx.creditPayment.updateMany({
            where: { posOrderLineId: line.refundOfLineId, deletedAt: null },
            data: { deletedAt: new Date() },
          });
        }
        if (line.invoiceId) {
          const refunded = Math.abs(line.total);
          await tx.invoicePayment.deleteMany({
            where: { posOrderLineId: line.refundOfLineId, method: { not: 'CLIENT_ACCOUNT' } },
          });
          const invoice = await tx.invoice.update({
            where: { id: line.invoiceId },
            data: { amountPaid: { decrement: refunded } },
            select: { saleOrderId: true, subscriptionId: true },
          });
          if (invoice.saleOrderId) {
            await tx.saleOrder.update({
              where: { id: invoice.saleOrderId },
              data: { amountPaid: { decrement: refunded } },
            });
          }
          if (invoice.subscriptionId) {
            await tx.subscription.update({
              where: { id: invoice.subscriptionId },
              data: { amountPaid: { decrement: refunded } },
            });
          }
        }
      }
      return { refund: created, original, total };
    });

    await this.auditService.log({
      entityType: POS_AUDIT.order,
      entityId: refund.id,
      action: 'CREATE',
      userId: actorId,
      summary: `POS refund ${formatOrderNumber(refund.number)} of order ${formatOrderNumber(original.number)} (${total})`,
    });
    return this.getById(refund.id);
  }
}

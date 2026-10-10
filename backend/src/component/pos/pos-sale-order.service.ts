import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ESaleOrderStatus, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import { FetchSaleOrdersDto, SaveSaleOrderDto } from 'src/dto/pos/posSale.dto';
import { AuditService } from '../audit/audit.service';
import {
  buildDocumentLines,
  formatSaleNumber,
  POS_AUDIT,
  round3,
  STAMP_DUTY,
  todayDateOnly,
  toDateOnly,
} from './pos.utils';

const userSelect = { id: true, firstName: true, lastName: true } satisfies Prisma.UserSelect;
const clientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  address: true,
  taxId: true,
  cin: true,
} satisfies Prisma.CreditClientSelect;

const listInclude = {
  client: { select: clientSelect },
  salesperson: { select: userSelect },
} satisfies Prisma.SaleOrderInclude;

const detailInclude = {
  ...listInclude,
  lines: { orderBy: { sortOrder: 'asc' } },
  invoices: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, status: true, year: true, sequence: true, total: true },
  },
} satisfies Prisma.SaleOrderInclude;

const EDITABLE_STATUSES: ESaleOrderStatus[] = ['DRAFT', 'SENT'];

@Injectable()
export class PosSaleOrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async log(entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', summary: string, actorId?: string) {
    await this.auditService.log({ entityType: POS_AUDIT.saleOrder, entityId, action, userId: actorId, summary });
  }

  private async findOrThrow(id: string) {
    const order = await this.prismaService.saleOrder.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!order) throw new NotFoundException('Sale order not found');
    return order;
  }

  private async assertClient(clientId: string) {
    const client = await this.prismaService.creditClient.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw new BadRequestException('Client not found');
  }

  private async assertProducts(productIds: (string | null | undefined)[]) {
    const ids = [...new Set(productIds.filter((id): id is string => !!id))];
    if (!ids.length) return;
    const count = await this.prismaService.posProduct.count({
      where: { id: { in: ids }, deletedAt: null },
    });
    if (count !== ids.length) throw new BadRequestException('Some products are unavailable');
  }

  async list(query: FetchSaleOrdersDto, pagination: PaginationData) {
    const search = query.search?.trim();
    const digits = search?.replace(/^s/i, '');
    const searchNumber = digits && /^\d+$/.test(digits) ? Number(digits) : undefined;
    const where: Prisma.SaleOrderWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.payable && {
        status: 'CONFIRMED',
        amountPaid: { lt: this.prismaService.saleOrder.fields.total },
      }),
      ...(search && {
        OR: [
          ...(searchNumber !== undefined && searchNumber <= 2147483647 ? [{ number: searchNumber }] : []),
          { client: { firstName: { contains: search, mode: 'insensitive' } } },
          { client: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const proxied = ProxyPrismaModel(this.prismaService.saleOrder as any);
    return proxied.findManyPaginated(
      { where, orderBy: [{ orderDate: 'desc' }, { number: 'desc' }], include: listInclude },
      pagination,
    );
  }

  async getById(id: string) {
    return this.findOrThrow(id);
  }

  async create(dto: SaveSaleOrderDto, actorId?: string) {
    await this.assertClient(dto.clientId);
    await this.assertProducts(dto.lines.map((l) => l.productId));
    const { lines, untaxed, taxTotal, total } = buildDocumentLines(dto.lines);
    const order = await this.prismaService.saleOrder.create({
      data: {
        clientId: dto.clientId,
        salespersonId: actorId || null,
        validUntil: dto.validUntil ? toDateOnly(dto.validUntil) : null,
        note: dto.note?.trim() || null,
        untaxed,
        taxTotal,
        total,
        lines: { create: lines },
      },
    });
    await this.log(order.id, 'CREATE', `Created quotation ${formatSaleNumber(order.number)}`, actorId);
    return this.findOrThrow(order.id);
  }

  async update(id: string, dto: SaveSaleOrderDto, actorId?: string) {
    const existing = await this.findOrThrow(id);
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      throw new BadRequestException('Only quotations can be edited');
    }
    await this.assertClient(dto.clientId);
    await this.assertProducts(dto.lines.map((l) => l.productId));
    const { lines, untaxed, taxTotal, total } = buildDocumentLines(dto.lines);
    await this.prismaService.$transaction([
      this.prismaService.saleOrderLine.deleteMany({ where: { saleOrderId: id } }),
      this.prismaService.saleOrder.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          validUntil: dto.validUntil ? toDateOnly(dto.validUntil) : null,
          note: dto.note?.trim() || null,
          untaxed,
          taxTotal,
          total,
          lines: { create: lines },
        },
      }),
    ]);
    await this.log(id, 'UPDATE', `Updated quotation ${formatSaleNumber(existing.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async markSent(id: string, actorId?: string) {
    const order = await this.findOrThrow(id);
    if (order.status !== 'DRAFT') throw new BadRequestException('Only draft quotations can be sent');
    await this.prismaService.saleOrder.update({ where: { id }, data: { status: 'SENT' } });
    await this.log(id, 'UPDATE', `Quotation ${formatSaleNumber(order.number)} marked as sent`, actorId);
    return this.findOrThrow(id);
  }

  async confirm(id: string, actorId?: string) {
    const order = await this.findOrThrow(id);
    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException('Only quotations can be confirmed');
    }
    await this.prismaService.$transaction(async (tx) => {
      for (const line of order.lines) {
        if (!line.productId) continue;
        await tx.posProduct.update({
          where: { id: line.productId },
          data: { stockQty: { decrement: line.quantity } },
        });
      }

      await tx.saleOrder.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    });
    await this.log(id, 'UPDATE', `Confirmed order ${formatSaleNumber(order.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async cancel(id: string, actorId?: string) {
    const order = await this.findOrThrow(id);
    if (order.status === 'CANCELLED') throw new BadRequestException('Order is already cancelled');
    if (Number(order.amountPaid) > 0) {
      throw new BadRequestException('Refund the payments of this order before cancelling it');
    }
    if (order.invoices.some((inv) => inv.type === 'INVOICE' && inv.status === 'POSTED')) {
      throw new BadRequestException('This order has a posted invoice');
    }
    await this.prismaService.$transaction(async (tx) => {
      if (order.status === 'CONFIRMED') {
        for (const line of order.lines) {
          if (!line.productId) continue;
          await tx.posProduct.update({
            where: { id: line.productId },
            data: { stockQty: { increment: line.quantity } },
          });
        }
      }
      await tx.invoice.updateMany({
        where: { saleOrderId: id, status: 'DRAFT' },
        data: { status: 'CANCELLED' },
      });
      await tx.saleOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
    });
    await this.log(id, 'UPDATE', `Cancelled order ${formatSaleNumber(order.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async createInvoice(id: string, actorId?: string) {
    const order = await this.findOrThrow(id);
    if (order.status !== 'CONFIRMED') throw new BadRequestException('Confirm the order first');
    if (order.invoices.some((inv) => inv.type === 'INVOICE' && inv.status !== 'CANCELLED')) {
      throw new BadRequestException('This order is already invoiced');
    }
    const today = todayDateOnly();
    const stampDuty = STAMP_DUTY;
    const total = round3(Number(order.total) + stampDuty);
    const prepaid = round3(Math.min(Number(order.amountPaid), total));
    const invoice = await this.prismaService.invoice.create({
      data: {
        clientId: order.clientId,
        saleOrderId: order.id,
        invoiceDate: today,
        dueDate: today,
        note: order.note,
        untaxed: order.untaxed,
        taxTotal: order.taxTotal,
        stampDuty,
        total,
        amountPaid: prepaid,
        lines: {
          create: order.lines.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPct: line.discountPct,
            taxRate: line.taxRate,
            subtotal: line.subtotal,
            taxAmount: line.taxAmount,
            total: line.total,
            sortOrder: line.sortOrder,
          })),
        },
        ...(prepaid > 0 && {
          payments: {
            create: {
              date: today,
              method: 'CASH',
              amount: prepaid,
              note: `Caisse - ${formatSaleNumber(order.number)}`,
              createdById: actorId || null,
            },
          },
        }),
      },
    });
    await this.auditService.log({
      entityType: POS_AUDIT.invoice,
      entityId: invoice.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Draft invoice created from ${formatSaleNumber(order.number)}`,
    });
    return invoice;
  }

  async remove(id: string, actorId?: string) {
    const order = await this.findOrThrow(id);
    if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
      throw new BadRequestException('Only draft or cancelled orders can be deleted');
    }
    await this.prismaService.saleOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.log(id, 'DELETE', `Deleted order ${formatSaleNumber(order.number)}`, actorId);
    return { id };
  }
}

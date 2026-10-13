import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import {
  CreateCreditClientDto,
  UpdateCreditClientDto,
} from 'src/dto/credit/creditClient.dto';
import { CreateCreditDto, CreateCreditPaymentDto } from 'src/dto/credit/credit.dto';
import { AuditService } from '../audit/audit.service';
import { formatAuditDate, formatAuditMoney } from 'src/common/utils/audit-format.util';

const ENTITY_TYPE = 'CREDIT';
const CREDIT_ERROR_REGISTER_PAYMENT = 'Register payments must be refunded from the register';

const activePayments = {
  where: { deletedAt: null },
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
} satisfies Prisma.Credit$paymentsArgs;

type CreditWithPayments = Prisma.CreditGetPayload<{
  include: { payments: typeof activePayments; client: true };
}>;

interface CreditTotals {
  totalCredit: number;
  totalPaid: number;
  remaining: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CreditService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private toDateOnly(value: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private creditTotals(credit: Pick<CreditWithPayments, 'amount' | 'payments'>): CreditTotals {
    const totalCredit = Number(credit.amount);
    const totalPaid = credit.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalCredit: round2(totalCredit),
      totalPaid: round2(totalPaid),
      remaining: round2(totalCredit - totalPaid),
    };
  }

  private sumTotals(items: CreditTotals[]): CreditTotals {
    const totals = items.reduce(
      (acc, item) => ({
        totalCredit: acc.totalCredit + item.totalCredit,
        totalPaid: acc.totalPaid + item.totalPaid,
        remaining: acc.remaining + item.remaining,
      }),
      { totalCredit: 0, totalPaid: 0, remaining: 0 },
    );
    return {
      totalCredit: round2(totals.totalCredit),
      totalPaid: round2(totals.totalPaid),
      remaining: round2(totals.remaining),
    };
  }

  private async log(
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    summary: string,
    actorId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.auditService.log({
      entityType: ENTITY_TYPE,
      entityId,
      action,
      userId: actorId,
      summary,
      metadata,
    });
  }

  async createClient(dto: CreateCreditClientDto, actorId?: string) {
    const client = await this.prismaService.creditClient.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        taxId: dto.taxId?.trim() || null,
        cin: dto.cin?.trim() || null,
      },
    });
    const phonePart = client.phone ? ` (${client.phone})` : '';
    await this.log(
      client.id,
      'CREATE',
      `Client de crédit créé : ${client.firstName} ${client.lastName}${phonePart}`,
      actorId,
      { clientId: client.id, name: `${client.firstName} ${client.lastName}`, phone: client.phone },
    );
    return client;
  }

  async updateClient(id: string, dto: UpdateCreditClientDto, actorId?: string) {
    await this.getClientById(id);
    const client = await this.prismaService.creditClient.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.phone !== undefined && {
          phone: dto.phone?.replaceAll(/\s+/g, '') || null,
        }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId?.trim() || null }),
        ...(dto.cin !== undefined && { cin: dto.cin?.trim() || null }),
      },
    });
    await this.log(
      client.id,
      'UPDATE',
      `Client de crédit modifié : ${client.firstName} ${client.lastName}`,
      actorId,
      { clientId: client.id, name: `${client.firstName} ${client.lastName}` },
    );
    return client;
  }

  async getClientById(id: string) {
    const client = await this.prismaService.creditClient.findFirst({
      where: { id, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Credit client not found');
    return client;
  }

  async deleteClient(id: string, actorId?: string) {
    await this.getClientById(id);
    const client = await this.prismaService.creditClient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(
      client.id,
      'DELETE',
      `Deleted credit client ${client.firstName} ${client.lastName}`,
      actorId,
    );
    return client;
  }

  async listClients(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.CreditClientWhereInput,
    filter?: string,
  ) {
    const andWhere = buildAndFilters(search);
    let idFilter: Prisma.StringFilter | undefined;

    if (filter === 'with_balance' || filter === 'settled') {
      const credits = await this.prismaService.credit.findMany({
        where: { deletedAt: null, client: { deletedAt: null } },
        include: { payments: activePayments },
      });
      const remainingByClient = new Map<string, number>();
      for (const credit of credits) {
        const ct = this.creditTotals(credit);
        remainingByClient.set(
          credit.clientId,
          (remainingByClient.get(credit.clientId) ?? 0) + ct.remaining,
        );
      }
      const withBal: string[] = [];
      for (const [clientId, rem] of remainingByClient) {
        if (round2(rem) > 0) withBal.push(clientId);
      }
      if (filter === 'with_balance') {
        idFilter = { in: withBal };
      } else {
        idFilter = { notIn: withBal };
      }
    } else if (filter === 'has_credit') {
      const credits = await this.prismaService.credit.findMany({
        where: { deletedAt: null, client: { deletedAt: null } },
        select: { clientId: true },
        distinct: ['clientId'],
      });
      idFilter = { in: credits.map((c) => c.clientId) };
    }

    const proxied = ProxyPrismaModel(this.prismaService.creditClient as any);
    const whereCondition = idFilter
      ? composeWhere({ deletedAt: null, id: idFilter }, andWhere)
      : composeWhere({ deletedAt: null }, andWhere);

    let resolvedOrderBy = orderBy;
    if (Array.isArray(orderBy)) {
      resolvedOrderBy = orderBy.flatMap((o) => {
        if (o && typeof o === 'object') {
          if ('name' in o) {
            const dir = (o as any).name;
            return [{ firstName: dir }, { lastName: dir }];
          }
          if ('firstName' in o) {
            const dir = (o as any).firstName;
            return [{ firstName: dir }, { lastName: dir }];
          }
        }
        return [o];
      });
    }

    const page = await proxied.findManyPaginated(
      {
        where: whereCondition,
        orderBy: resolvedOrderBy,
      },
      pagination,
    );

    const clients = page.data as { id: string }[];
    const credits = await this.prismaService.credit.findMany({
      where: { deletedAt: null, clientId: { in: clients.map((c) => c.id) } },
      include: { payments: activePayments },
    });

    const totalsByClient = new Map<string, CreditTotals[]>();
    for (const credit of credits) {
      const list = totalsByClient.get(credit.clientId) ?? [];
      list.push(this.creditTotals(credit));
      totalsByClient.set(credit.clientId, list);
    }

    return {
      ...page,
      data: clients.map((client) => {
        const list = totalsByClient.get(client.id) ?? [];
        return { ...client, creditCount: list.length, ...this.sumTotals(list) };
      }),
    };
  }

  async getClientDetail(id: string) {
    const client = await this.getClientById(id);
    const credits = await this.prismaService.credit.findMany({
      where: { clientId: id, deletedAt: null },
      include: { payments: activePayments },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    const creditsWithTotals = credits.map((credit) => ({
      ...credit,
      ...this.creditTotals(credit),
    }));
    return {
      ...client,
      ...this.sumTotals(creditsWithTotals),
      credits: creditsWithTotals,
    };
  }

  async getSummary() {
    const credits = await this.prismaService.credit.findMany({
      where: { deletedAt: null, client: { deletedAt: null } },
      include: { payments: activePayments },
    });

    const remainingByClient = new Map<string, number>();
    const totals = credits.map((credit) => {
      const creditTotals = this.creditTotals(credit);
      remainingByClient.set(
        credit.clientId,
        (remainingByClient.get(credit.clientId) ?? 0) + creditTotals.remaining,
      );
      return creditTotals;
    });

    const clientsWithBalance = [...remainingByClient.values()].filter(
      (remaining) => round2(remaining) > 0,
    ).length;

    return { ...this.sumTotals(totals), clientsWithBalance };
  }

  private async getCreditWithPayments(id: string): Promise<CreditWithPayments> {
    const credit = await this.prismaService.credit.findFirst({
      where: { id, deletedAt: null, client: { deletedAt: null } },
      include: { payments: activePayments, client: true },
    });
    if (!credit) throw new NotFoundException('Credit not found');
    return credit;
  }

  async createCredit(dto: CreateCreditDto, actorId?: string) {
    const client = await this.getClientById(dto.clientId);
    const credit = await this.prismaService.$transaction(async (tx) => {
      const product = dto.productId
        ? await tx.posProduct.findFirst({
            where: { id: dto.productId, deletedAt: null },
            select: { id: true, name: true, price: true },
          })
        : null;
      if (dto.productId && !product) throw new BadRequestException('Product not found');

      const quantity = product ? Number(dto.quantity) : null;
      const amount = product ? round2(Number(product.price) * quantity!) : Number(dto.amount);
      if (amount <= 0) throw new BadRequestException('Credit amount must be positive');
      const productLabel = product && (quantity === 1 ? product.name : `${quantity} x ${product.name}`);

      if (product) {
        await tx.posProduct.update({
          where: { id: product.id },
          data: { stockQty: { decrement: quantity! } },
        });
      }
      return tx.credit.create({
        data: {
          clientId: client.id,
          date: this.toDateOnly(dto.date),
          amount: amount.toFixed(2),
          description: dto.description?.trim() || productLabel || null,
          productId: product?.id ?? null,
          quantity,
        },
      });
    });
    const descPart = credit.description ? ` · Motif : "${credit.description}"` : '';
    await this.log(
      credit.id,
      'CREATE',
      `Crédit accordé : ${client.firstName} ${client.lastName} · Montant : ${formatAuditMoney(credit.amount)}${descPart} · Date : ${formatAuditDate(credit.date)}`,
      actorId,
      {
        creditId: credit.id,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        amount: Number(credit.amount),
        date: credit.date,
      },
    );
    return credit;
  }

  async deleteCredit(id: string, actorId?: string) {
    await this.getCreditWithPayments(id);
    const credit = await this.prismaService.$transaction(async (tx) => {
      const deleted = await tx.credit.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      if (deleted.productId && deleted.quantity) {
        await tx.posProduct.update({
          where: { id: deleted.productId },
          data: { stockQty: { increment: deleted.quantity } },
        });
      }
      return deleted;
    });
    await this.log(
      credit.id,
      'DELETE',
      `Crédit supprimé · Montant : ${formatAuditMoney(credit.amount)}`,
      actorId,
      { creditId: credit.id, amount: Number(credit.amount) },
    );
    return credit;
  }

  async addPayment(creditId: string, dto: CreateCreditPaymentDto, actorId?: string) {
    const credit = await this.getCreditWithPayments(creditId);
    const { remaining } = this.creditTotals(credit);
    if (round2(dto.amount) > remaining) {
      throw new BadRequestException('Payment exceeds the remaining amount');
    }
    const payment = await this.prismaService.creditPayment.create({
      data: {
        creditId,
        date: this.toDateOnly(dto.date),
        amount: Number(dto.amount).toFixed(2),
        note: dto.note?.trim() || null,
      },
    });
    const clientName = `${credit.client.firstName} ${credit.client.lastName}`.trim();
    const remainingAfter = round2(remaining - Number(payment.amount));
    await this.log(
      creditId,
      'UPDATE',
      `Règlement de crédit enregistré : Client ${clientName} · Montant réglé : ${formatAuditMoney(payment.amount)} (Reste dû : ${formatAuditMoney(remainingAfter)}) · Date : ${formatAuditDate(payment.date)}`,
      actorId,
      {
        creditId,
        paymentId: payment.id,
        clientName,
        amount: Number(payment.amount),
        remainingAfter,
      },
    );
    return payment;
  }

  async deletePayment(id: string, actorId?: string) {
    const payment = await this.prismaService.creditPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.posOrderLineId) {
      throw new BadRequestException(CREDIT_ERROR_REGISTER_PAYMENT);
    }
    const deleted = await this.prismaService.creditPayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(
      payment.creditId,
      'UPDATE',
      `Règlement de crédit supprimé · Montant : ${formatAuditMoney(payment.amount)}`,
      actorId,
      { paymentId: payment.id, amount: Number(payment.amount) },
    );
    return deleted;
  }
}

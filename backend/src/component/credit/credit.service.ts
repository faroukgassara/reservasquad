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
import {
  CreateCreditDto,
  CreateCreditPaymentDto,
  UpdateCreditDto,
} from 'src/dto/credit/credit.dto';
import { AuditService } from '../audit/audit.service';

const ENTITY_TYPE = 'CREDIT';

const activePayments = {
  where: { deletedAt: null },
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
} satisfies Prisma.Credit$paymentsArgs;

type CreditWithPayments = Prisma.CreditGetPayload<{
  include: { payments: typeof activePayments };
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
  ) {
    await this.auditService.log({
      entityType: ENTITY_TYPE,
      entityId,
      action,
      userId: actorId,
      summary,
    });
  }

  async createClient(dto: CreateCreditClientDto, actorId?: string) {
    const client = await this.prismaService.creditClient.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
      },
    });
    await this.log(
      client.id,
      'CREATE',
      `Created credit client ${client.firstName} ${client.lastName}`,
      actorId,
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
      },
    });
    await this.log(
      client.id,
      'UPDATE',
      `Updated credit client ${client.firstName} ${client.lastName}`,
      actorId,
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
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.creditClient as any);
    const page = await proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: null }, andWhere),
        orderBy,
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
      include: { payments: activePayments },
    });
    if (!credit) throw new NotFoundException('Credit not found');
    return credit;
  }

  async createCredit(dto: CreateCreditDto, actorId?: string) {
    const client = await this.getClientById(dto.clientId);
    const credit = await this.prismaService.credit.create({
      data: {
        clientId: client.id,
        date: this.toDateOnly(dto.date),
        amount: Number(dto.amount).toFixed(2),
        description: dto.description?.trim() || null,
      },
    });
    await this.log(
      credit.id,
      'CREATE',
      `Added credit of ${credit.amount.toString()} for ${client.firstName} ${client.lastName}`,
      actorId,
    );
    return credit;
  }

  async updateCredit(id: string, dto: UpdateCreditDto, actorId?: string) {
    const existing = await this.getCreditWithPayments(id);
    if (dto.amount !== undefined) {
      const { totalPaid } = this.creditTotals(existing);
      if (round2(dto.amount) < totalPaid) {
        throw new BadRequestException(
          'Credit amount cannot be lower than the amount already paid',
        );
      }
    }
    const credit = await this.prismaService.credit.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: this.toDateOnly(dto.date) }),
        ...(dto.amount !== undefined && { amount: Number(dto.amount).toFixed(2) }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
      },
    });
    await this.log(credit.id, 'UPDATE', `Updated credit ${credit.id}`, actorId);
    return credit;
  }

  async deleteCredit(id: string, actorId?: string) {
    await this.getCreditWithPayments(id);
    const credit = await this.prismaService.credit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(
      credit.id,
      'DELETE',
      `Deleted credit of ${credit.amount.toString()}`,
      actorId,
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
    await this.log(
      creditId,
      'UPDATE',
      `Recorded payment of ${payment.amount.toString()}`,
      actorId,
    );
    return payment;
  }

  async deletePayment(id: string, actorId?: string) {
    const payment = await this.prismaService.creditPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const deleted = await this.prismaService.creditPayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(
      payment.creditId,
      'UPDATE',
      `Deleted payment of ${payment.amount.toString()}`,
      actorId,
    );
    return deleted;
  }
}

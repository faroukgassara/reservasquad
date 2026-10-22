import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EPosPaymentMethod, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import { ClosePosSessionDto, OpenPosSessionDto, UpdatePosSettingsDto } from 'src/dto/pos/posSession.dto';
import { AuditService } from '../audit/audit.service';
import { DailyIncomeService } from '../dailyIncome/daily-income.service';
import { POS_AUDIT, round3, sumBy } from './pos.utils';
import { formatAuditMoney } from 'src/common/utils/audit-format.util';

const POS_SETTINGS_ID = 'default';

const userSelect = { id: true, firstName: true, lastName: true } satisfies Prisma.UserSelect;

const sessionInclude = {
  openedBy: { select: userSelect },
  closedBy: { select: userSelect },
} satisfies Prisma.PosSessionInclude;

@Injectable()
export class PosSessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly dailyIncomeService: DailyIncomeService,
  ) {}

  async getCurrent() {
    return this.prismaService.posSession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: sessionInclude,
    });
  }

  async getLastClosed() {
    return this.prismaService.posSession.findFirst({
      where: { status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      include: sessionInclude,
    });
  }

  async getById(id: string) {
    const session = await this.prismaService.posSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getOpenSessionOrThrow(id: string) {
    const session = await this.getById(id);
    if (session.status !== 'OPEN') throw new BadRequestException('Session is closed');
    return session;
  }

  async list(pagination: PaginationData) {
    const proxied = ProxyPrismaModel(this.prismaService.posSession as any);
    const result = await proxied.findManyPaginated(
      {
        orderBy: [{ openedAt: 'desc' }],
        include: { ...sessionInclude, _count: { select: { orders: true } } },
      },
      pagination,
    );

    const [closedSessions, openSession] = await Promise.all([
      this.prismaService.posSession.findMany({
        where: { status: 'CLOSED' },
        select: { expectedCash: true, openingCash: true },
      }),
      this.prismaService.posSession.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      }),
    ]);

    const openCashMap = new Map<string, number>();
    let openSessionCash = 0;
    if (openSession) {
      const summary = await this.getSummary(openSession.id);
      openCashMap.set(openSession.id, summary.cashPayments);
      openSessionCash = summary.cashPayments;
    }

    const totalClosedCash = closedSessions.reduce(
      (sum, s) =>
        sum +
        (s.expectedCash !== null
          ? Number(s.expectedCash) - Number(s.openingCash)
          : 0),
      0,
    );
    const totalCashCollected = round3(totalClosedCash + openSessionCash);

    const data = (result.data as any[]).map((s) => {
      const cashPayments =
        s.status === 'OPEN'
          ? (openCashMap.get(s.id) ?? 0)
          : s.expectedCash !== null
            ? round3(Number(s.expectedCash) - Number(s.openingCash))
            : 0;
      return {
        ...s,
        cashPayments,
      };
    });

    return {
      ...result,
      data,
      summary: {
        totalCashCollected,
        openSessionsCount: openSession ? 1 : 0,
      },
    };
  }

  async getSettings(): Promise<{ defaultOpeningCash: number; allowCashierOverride: boolean; syncDailyIncome: boolean }> {
    const settings = await this.prismaService.posSettings.findUnique({ where: { id: POS_SETTINGS_ID } });
    return {
      defaultOpeningCash: settings ? Number(settings.defaultOpeningCash) : 0,
      allowCashierOverride: settings?.allowCashierOverride ?? false,
      syncDailyIncome: settings?.syncDailyIncome ?? false,
    };
  }

  async updateSettings(dto: UpdatePosSettingsDto, actorId?: string) {
    const data = {
      defaultOpeningCash: round3(dto.defaultOpeningCash),
      allowCashierOverride: dto.allowCashierOverride,
      syncDailyIncome: dto.syncDailyIncome,
      updatedById: actorId || null,
    };
    await this.prismaService.posSettings.upsert({
      where: { id: POS_SETTINGS_ID },
      create: { id: POS_SETTINGS_ID, ...data },
      update: data,
    });
    await this.auditService.log({
      entityType: POS_AUDIT.settings,
      entityId: POS_SETTINGS_ID,
      action: 'UPDATE',
      userId: actorId,
      summary: `Fond de caisse fixé à ${formatAuditMoney(data.defaultOpeningCash)}${
        data.allowCashierOverride ? ' · modifiable par le caissier' : ''
      }${data.syncDailyIncome ? ' · synchronisation des revenus activée' : ' · synchronisation des revenus désactivée'}`,
      metadata: {
        defaultOpeningCash: data.defaultOpeningCash,
        allowCashierOverride: data.allowCashierOverride,
        syncDailyIncome: data.syncDailyIncome,
      },
    });
    return this.getSettings();
  }

  async open(dto: OpenPosSessionDto, actorId?: string) {
    const settings = await this.getSettings();
    const openingCash =
      settings.allowCashierOverride && dto.openingCash !== undefined ? dto.openingCash : settings.defaultOpeningCash;

    const session = await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.posSession.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      });
      if (existing) throw new BadRequestException('A session is already open');
      return tx.posSession.create({
        data: { openingCash, openedById: actorId || null },
        include: sessionInclude,
      });
    });
    await this.auditService.log({
      entityType: POS_AUDIT.session,
      entityId: session.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Ouverture de la session de caisse N° ${session.number} · Fond de caisse initial : ${formatAuditMoney(openingCash)}`,
      metadata: { sessionNumber: session.number, openingCash: Number(openingCash) },
    });
    return session;
  }

  async getSummary(id: string) {
    const session = await this.getById(id);
    const [orders, payments] = await Promise.all([
      this.prismaService.posOrder.findMany({
        where: { sessionId: id },
        select: { total: true, change: true, status: true },
      }),
      this.prismaService.posPayment.groupBy({
        by: ['method'],
        where: { order: { sessionId: id } },
        _sum: { amount: true },
      }),
    ]);

    const byMethod = (method: EPosPaymentMethod) =>
      round3(Number(payments.find((p) => p.method === method)?._sum.amount ?? 0));
    const totalChange = sumBy(orders, (o) => o.change);
    const cashPayments = round3(byMethod('CASH') - totalChange);
    const openingCash = round3(Number(session.openingCash));
    const expectedCash = round3(openingCash + cashPayments);
    const bankPayments = byMethod('BANK');

    return {
      session,
      ordersCount: orders.filter((o) => o.status === 'PAID').length,
      refundsCount: orders.filter((o) => o.status === 'REFUND').length,
      ordersTotal: sumBy(orders, (o) => o.total),
      openingCash,
      cashPayments,
      bankPayments,
      clientAccountPayments: byMethod('CLIENT_ACCOUNT'),
      expectedCash,
      revenue: round3(cashPayments + bankPayments),
    };
  }

  async close(id: string, dto: ClosePosSessionDto, actorId?: string) {
    await this.getOpenSessionOrThrow(id);
    const settings = await this.getSettings();
    const { expectedCash, revenue, openingCash } = await this.getSummary(id);
    const difference =
      Math.abs(dto.countedCash - openingCash) <= Math.abs(dto.countedCash - expectedCash)
        ? round3(dto.countedCash - openingCash)
        : round3(dto.countedCash - expectedCash);
    const shouldSyncDailyIncome = settings.syncDailyIncome;
    const { session, dailyIncome } = await this.prismaService.$transaction(async (tx) => {
      const session = await tx.posSession.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: actorId || null,
          countedCash: dto.countedCash,
          expectedCash,
          difference,
          closingNote: dto.note?.trim() || null,
        },
        include: sessionInclude,
      });
      const opened = session.openedAt;
      const dailyIncome =
        shouldSyncDailyIncome && revenue > 0
          ? await this.dailyIncomeService.createForSession(
              tx,
              session.id,
              new Date(Date.UTC(opened.getFullYear(), opened.getMonth(), opened.getDate())),
              revenue,
            )
          : null;
      return { session, dailyIncome };
    });
    await this.auditService.log({
      entityType: POS_AUDIT.session,
      entityId: session.id,
      action: 'UPDATE',
      userId: actorId,
      summary: `Clôture de la session de caisse N° ${session.number} · Espèces comptées : ${formatAuditMoney(dto.countedCash)} · Espèces attendues : ${formatAuditMoney(expectedCash)} · Écart : ${formatAuditMoney(difference)} · Revenu total : ${formatAuditMoney(revenue)}`,
      metadata: {
        sessionNumber: session.number,
        countedCash: Number(dto.countedCash),
        expectedCash,
        difference,
        revenue,
      },
    });
    if (dailyIncome) {
      await this.auditService.log({
        entityType: 'DAILY_INCOME',
        entityId: dailyIncome.id,
        action: 'CREATE',
        userId: actorId,
        summary: `Revenu journalier généré depuis la caisse N° ${session.number} · Montant : ${formatAuditMoney(revenue)}`,
        metadata: {
          posSessionId: session.id,
          sessionNumber: session.number,
          revenue,
        },
      });
    }
    return session;
  }
}

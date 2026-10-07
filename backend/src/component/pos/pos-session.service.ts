import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EPosPaymentMethod, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import { ClosePosSessionDto, OpenPosSessionDto } from 'src/dto/pos/posSession.dto';
import { AuditService } from '../audit/audit.service';
import { DailyIncomeService } from '../dailyIncome/daily-income.service';
import { POS_AUDIT, round3, sumBy } from './pos.utils';

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
    return proxied.findManyPaginated(
      {
        orderBy: [{ openedAt: 'desc' }],
        include: { ...sessionInclude, _count: { select: { orders: true } } },
      },
      pagination,
    );
  }

  async open(dto: OpenPosSessionDto, actorId?: string) {
    const session = await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.posSession.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      });
      if (existing) throw new BadRequestException('A session is already open');
      return tx.posSession.create({
        data: { openingCash: dto.openingCash, openedById: actorId || null },
        include: sessionInclude,
      });
    });
    await this.auditService.log({
      entityType: POS_AUDIT.session,
      entityId: session.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Opened POS session #${session.number} with ${dto.openingCash}`,
    });
    return session;
  }

  async getSummary(id: string) {
    const session = await this.getById(id);
    const [orders, payments, cashMoves] = await Promise.all([
      this.prismaService.posOrder.findMany({
        where: { sessionId: id },
        select: { total: true, change: true, status: true },
      }),
      this.prismaService.posPayment.groupBy({
        by: ['method'],
        where: { order: { sessionId: id } },
        _sum: { amount: true },
      }),
      this.prismaService.posCashMove.findMany({
        where: { sessionId: id },
        select: { type: true, amount: true },
      }),
    ]);

    const byMethod = (method: EPosPaymentMethod) =>
      round3(Number(payments.find((p) => p.method === method)?._sum.amount ?? 0));
    const totalChange = sumBy(orders, (o) => o.change);
    const cashPayments = round3(byMethod('CASH') - totalChange);
    const cashIn = sumBy(cashMoves.filter((m) => m.type === 'IN'), (m) => m.amount);
    const cashOut = sumBy(cashMoves.filter((m) => m.type === 'OUT'), (m) => m.amount);
    const openingCash = round3(Number(session.openingCash));
    const expectedCash = round3(openingCash + cashPayments + cashIn - cashOut);
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
      cashIn,
      cashOut,
      expectedCash,
      revenue: round3(cashPayments + bankPayments),
    };
  }

  async close(id: string, dto: ClosePosSessionDto, actorId?: string) {
    await this.getOpenSessionOrThrow(id);
    const { expectedCash, revenue } = await this.getSummary(id);
    const difference = round3(dto.countedCash - expectedCash);
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
        revenue > 0
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
      summary: `Closed POS session #${session.number} (counted ${dto.countedCash}, expected ${expectedCash}, difference ${difference})`,
    });
    if (dailyIncome) {
      await this.auditService.log({
        entityType: 'DAILY_INCOME',
        entityId: dailyIncome.id,
        action: 'CREATE',
        userId: actorId,
        summary: `Created daily income ${revenue} from POS session #${session.number}`,
      });
    }
    return session;
  }
}
